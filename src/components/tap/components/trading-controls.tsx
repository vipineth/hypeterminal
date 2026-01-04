import { useCallback } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useTradingAgent } from "@/hooks/hyperliquid/use-trading-agent";
import { usePerpMarketRegistry } from "@/hooks/hyperliquid/use-market-registry";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { ensureLeverage, makeExchangeConfig, placeSingleOrder } from "@/lib/hyperliquid/exchange";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { toast } from "sonner";
import { ASSET_TO_COIN } from "../constants";
import { useTapTradeActions, useTapTradePrice, useTapTradeSettings } from "../hooks/use-tap-trade-store";
import { calculatePositionSize, estimateLiquidationPrice, formatPrice } from "../lib/calculations";
import { TapGrid } from "./tap-grid";
import type { ActiveBet, TapBox } from "../types";

export function TradingControls() {
	const { address, isConnected } = useConnection();
	const { data: walletClient } = useWalletClient();
	const { asset, betAmount } = useTapTradeSettings();
	const { currentPrice } = useTapTradePrice();
	const { addActiveBet } = useTapTradeActions();

	// Get clearinghouse state for balance
	const { data: clearinghouseState } = useClearinghouseState({ user: address });
	const availableBalance = clearinghouseState?.withdrawable
		? parseFloat(clearinghouseState.withdrawable)
		: 0;

	// Get trading agent
	const { isApproved, apiWalletSigner, canApprove, approveAgent } = useTradingAgent({
		user: address,
		walletClient,
		enabled: isConnected,
	});

	// Get market registry to find asset index
	const { registry: marketRegistry } = usePerpMarketRegistry();

	const coin = ASSET_TO_COIN[asset];
	const market = marketRegistry?.coinToInfo.get(coin);
	const assetIndex = market?.assetIndex;
	const szDecimals = market?.szDecimals ?? 0;

	const isReady = isConnected && isApproved && !!apiWalletSigner && typeof assetIndex === "number";
	const needsApproval = isConnected && !isApproved;

	const handleTradeRequest = useCallback(
		async (box: TapBox) => {
			if (!isConnected) {
				toast.error("Please connect your wallet");
				return;
			}
			if (!isApproved) {
				toast.error("Please enable trading first");
				return;
			}
			if (!apiWalletSigner) {
				toast.error("Wallet signer not ready");
				return;
			}
			if (typeof assetIndex !== "number") {
				toast.error("Market not ready");
				return;
			}
			if (currentPrice === null) {
				toast.error("Price not available");
				return;
			}

			const { sizeAsset, sizeUsd } = calculatePositionSize(betAmount, box.leverage, currentPrice);
			const entryPrice = currentPrice;
			const tpPrice = box.priceLevel;
			const isBuy = box.direction === "LONG";

			const slippageBps = 50;
			const slippageMultiplier = isBuy ? 1 + slippageBps / 10000 : 1 - slippageBps / 10000;
			const orderPrice = entryPrice * slippageMultiplier;

			const formattedOrderPrice = formatPriceForOrder(orderPrice);
			const formattedTpPrice = formatPriceForOrder(tpPrice);
			const formattedSize = formatSizeForOrder(sizeAsset, szDecimals);

			const betId = `tap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

			try {
				const transport = getHttpTransport();
				const config = makeExchangeConfig(transport, apiWalletSigner);

				await ensureLeverage(config, {
					asset: assetIndex,
					isCross: true,
					leverage: box.leverage,
				});

				// Place ENTRY order first to open the position
				const entryOrder = {
					a: assetIndex,
					b: isBuy,
					p: formattedOrderPrice,
					s: formattedSize,
					r: false,
					t: { limit: { tif: "FrontendMarket" as const } },
				};

				const entryResult = await placeSingleOrder(config, { order: entryOrder });
				const entryStatus = entryResult.response?.data?.statuses?.[0];
				if (entryStatus && "error" in entryStatus && typeof entryStatus.error === "string") {
					throw new Error(`Entry order failed: ${entryStatus.error}`);
				}

				const entryOrderId = entryStatus && "filled" in entryStatus
					? String(entryStatus.filled.oid)
					: `entry-${betId}`;

				// Now place TP order (reduce-only) after position is open
				const tpOrder = {
					a: assetIndex,
					b: !isBuy,
					p: formattedTpPrice,
					s: formattedSize,
					r: true,
					t: { limit: { tif: "Gtc" as const } },
				};

				const tpResult = await placeSingleOrder(config, { order: tpOrder });
				const tpStatus = tpResult.response?.data?.statuses?.[0];
				if (tpStatus && "error" in tpStatus && typeof tpStatus.error === "string") {
					throw new Error(`TP order failed: ${tpStatus.error}`);
				}

				const tpOrderId = tpStatus && "resting" in tpStatus ? String(tpStatus.resting.oid) : `tp-${betId}`;

				const activeBet: ActiveBet = {
					id: betId,
					coin,
					direction: box.direction,
					entryPrice,
					tpPrice,
					leverage: box.leverage,
					sizeAsset,
					sizeUsd,
					betAmount,
					startTime: Date.now(),
					tpOrderId,
					entryOrderId,
					estimatedLiqPrice: estimateLiquidationPrice(entryPrice, box.leverage, box.direction),
				};

				addActiveBet(activeBet);
				toast.success(
					`${box.direction} position opened at $${formatPrice(entryPrice, asset)}, TP at $${formatPrice(tpPrice, asset)}`
				);
			} catch (error) {
				console.error("[TapTrade] Execution failed:", error);
				const message = error instanceof Error ? error.message : "Trade execution failed";
				toast.error(message);
			}
		},
		[isConnected, isApproved, apiWalletSigner, assetIndex, currentPrice, betAmount, szDecimals, coin, asset, addActiveBet]
	);

	return (
		<>
			{/* Main Grid Area */}
			<div className="flex-1 overflow-hidden">
				<TapGrid onTradeRequest={handleTradeRequest} className="h-full" />
			</div>

			{/* Trading Status Bar */}
			<div className="h-8 px-4 flex items-center gap-4 border-t border-border/30 bg-surface/20">
				<div className="flex items-center gap-2">
					<span className="text-2xs text-muted-foreground">Available:</span>
					<span className="text-xs font-medium">${availableBalance.toFixed(2)}</span>
				</div>

				{/* Enable Trading Button */}
				{needsApproval && (
					<Button
						variant="default"
						size="sm"
						onClick={() => approveAgent()}
						disabled={!canApprove}
						className="bg-terminal-cyan text-background hover:bg-terminal-cyan/80 h-6 text-xs"
					>
						Enable Trading
					</Button>
				)}

				{/* Ready indicator */}
				{!needsApproval && (
					<div className="flex items-center gap-1.5">
						<div
							className={`size-2 rounded-full ${isReady ? "bg-terminal-green" : "bg-terminal-amber"}`}
						/>
						<span className="text-2xs text-muted-foreground">
							{isReady ? "Ready" : "Not Ready"}
						</span>
					</div>
				)}
			</div>
		</>
	);
}
