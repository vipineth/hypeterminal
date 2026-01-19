import { ChevronDown, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
	ARBITRUM_CHAIN_ID,
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_FEE_RATE_MAKER,
	ORDER_FEE_RATE_TAKER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
	UI_TEXT,
} from "@/config/constants";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useSelectedResolvedMarket, useTradingAgent } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import { floorToDecimals, formatDecimalFloor, parseNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/lib/trade/orders";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { WalletDialog } from "../components/wallet-dialog";
import { DepositModal } from "../order-entry/deposit-modal";
import { LeverageControl } from "../order-entry/leverage-control";
import { OrderToast } from "../order-entry/order-toast";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";
type SizeMode = "asset" | "usd";

const ORDER_TEXT = UI_TEXT.ORDER_ENTRY;

interface MobileTradeViewProps {
	className?: string;
}

export function MobileTradeView({ className }: MobileTradeViewProps) {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market, isLoading: isMarketLoading } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const { data: clearinghouseEvent } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const clearinghouse = clearinghouseEvent?.clearinghouseState;

	const { status: agentStatus, registerStatus, signer: agentSigner, registerAgent } = useTradingAgent();

	const isAgentApproved = agentStatus === "valid";
	const apiWalletSigner = agentSigner;
	const canApprove = !!walletClient && !!address;
	const isRegistering = registerStatus === "signing" || registerStatus === "verifying";

	const slippageBps = useMarketOrderSlippageBps();

	const { displayLeverage: leverage, availableToSell, availableToBuy } = useAssetLeverage();

	const { addOrder, updateOrder } = useOrderQueueActions();
	const selectedPrice = useSelectedPrice();

	const [type, setType] = useState<OrderType>("market");
	const [side, setSide] = useState<Side>("buy");
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("usd");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [approvalError, setApprovalError] = useState<string | null>(null);

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);

	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchangeOrder();

	// Sync orderbook price clicks
	useEffect(() => {
		if (selectedPrice !== null) {
			setType("limit");
			setLimitPriceInput(String(selectedPrice));
			getOrderbookActionsStore().actions.clearSelectedPrice();
		}
	}, [selectedPrice]);

	// Derived values
	const accountValue = parseNumber(clearinghouse?.crossMarginSummary?.accountValue) || 0;
	const marginUsed = parseNumber(clearinghouse?.crossMarginSummary?.totalMarginUsed) || 0;
	const availableBalance = Math.max(0, accountValue - marginUsed);

	const position =
		!clearinghouse?.assetPositions || !market?.coin
			? null
			: (clearinghouse.assetPositions.find((p) => p.position.coin === market.coin) ?? null);
	const positionSize = parseNumber(position?.position?.szi) || 0;

	const ctxMarkPx = market?.ctxNumbers?.markPx;
	const markPx =
		typeof ctxMarkPx === "number" ? ctxMarkPx : typeof market?.midPxNumber === "number" ? market.midPxNumber : 0;
	const price = type === "market" ? markPx : parseNumber(limitPriceInput) || 0;

	const maxSize = useMemo(() => {
		if (!price || price <= 0) return 0;

		const availableFromSub = side === "buy" ? availableToBuy : availableToSell;
		if (availableFromSub !== null && availableFromSub > 0) {
			return floorToDecimals(availableFromSub, market?.szDecimals ?? 0);
		}

		if (!leverage || availableBalance <= 0) return 0;
		const maxNotional = availableBalance * leverage;
		let maxSizeRaw = maxNotional / price;
		if (side === "sell" && positionSize > 0) maxSizeRaw += positionSize;
		else if (side === "buy" && positionSize < 0) maxSizeRaw += Math.abs(positionSize);
		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
	}, [price, side, availableToBuy, availableToSell, leverage, availableBalance, positionSize, market?.szDecimals]);

	const sizeInputValue = parseNumber(sizeInput) || 0;
	const sizeValue = sizeMode === "usd" && price > 0 ? sizeInputValue / price : sizeInputValue;
	const orderValue = sizeValue * price;
	const marginRequired = leverage ? orderValue / leverage : 0;
	const feeRate = type === "market" ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
	const estimatedFee = orderValue * feeRate;

	const liqPrice = (() => {
		if (!price || !sizeValue || !leverage) return null;
		const buffer = price * (1 / leverage) * 0.9;
		return side === "buy" ? price - buffer : price + buffer;
	})();

	const canSign = isAgentApproved ? !!apiWalletSigner : !!walletClient;

	const validation = useMemo(() => {
		const errors: string[] = [];
		if (!isConnected)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NOT_CONNECTED], canSubmit: false, needsApproval: false };
		if (isWalletLoading)
			return { valid: false, errors: [ORDER_TEXT.ERROR_LOADING_WALLET], canSubmit: false, needsApproval: false };
		if (availableBalance <= 0)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_BALANCE], canSubmit: false, needsApproval: false };
		if (!market) return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARKET], canSubmit: false, needsApproval: false };
		if (typeof market.assetIndex !== "number")
			return { valid: false, errors: [ORDER_TEXT.ERROR_MARKET_NOT_READY], canSubmit: false, needsApproval: false };
		if (!isAgentApproved) return { valid: false, errors: [], canSubmit: false, needsApproval: true };
		if (!canSign)
			return { valid: false, errors: [ORDER_TEXT.ERROR_SIGNER_NOT_READY], canSubmit: false, needsApproval: false };
		if (type === "market" && !markPx)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARK_PRICE], canSubmit: false, needsApproval: false };
		if (type === "limit" && !price) errors.push(ORDER_TEXT.ERROR_LIMIT_PRICE);
		if (!sizeValue || sizeValue <= 0) errors.push(ORDER_TEXT.ERROR_SIZE);
		if (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD) errors.push(ORDER_TEXT.ERROR_MIN_NOTIONAL);
		if (sizeValue > maxSize && maxSize > 0) errors.push(ORDER_TEXT.ERROR_EXCEEDS_MAX);
		return { valid: errors.length === 0, errors, canSubmit: errors.length === 0, needsApproval: false };
	}, [
		isConnected,
		isWalletLoading,
		availableBalance,
		market,
		type,
		markPx,
		price,
		sizeValue,
		orderValue,
		maxSize,
		isAgentApproved,
		canSign,
	]);

	const applySizeFromPercent = (pct: number) => {
		if (maxSize <= 0) return;
		const newSize = maxSize * (pct / 100);
		if (sizeMode === "usd" && price > 0) {
			const usdValue = newSize * price;
			setSizeInput(usdValue > 0 ? usdValue.toFixed(2) : "");
		} else {
			const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
			setSizeInput(formatted || "");
		}
	};

	const handleSliderChange = (values: number[]) => applySizeFromPercent(values[0]);
	const handlePercentClick = (pct: number) => applySizeFromPercent(pct);

	const handleSizeModeToggle = () => {
		if (sizeMode === "asset" && price > 0 && sizeValue > 0) {
			setSizeInput((sizeValue * price).toFixed(2));
			setSizeMode("usd");
		} else if (sizeMode === "usd" && price > 0 && sizeValue > 0) {
			setSizeInput(formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "");
			setSizeMode("asset");
		} else {
			setSizeMode(sizeMode === "asset" ? "usd" : "asset");
		}
	};

	const handleMarkPriceClick = () => {
		if (markPx > 0) setLimitPriceInput(markPx.toFixed(szDecimalsToPriceDecimals(market?.szDecimals ?? 4)));
	};

	const handleSwitchChain = () => switchChain({ chainId: ARBITRUM_CHAIN_ID });

	const handleApprove = async () => {
		if (isRegistering) return;
		setApprovalError(null);
		try {
			await registerAgent();
		} catch (error) {
			setApprovalError(error instanceof Error ? error.message : ORDER_TEXT.APPROVAL_ERROR_FALLBACK);
		}
	};

	const handleSubmit = async () => {
		if (!validation.canSubmit || isSubmitting) return;
		if (!market || typeof market.assetIndex !== "number") return;

		let orderPrice = price;
		if (type === "market") {
			orderPrice = side === "buy" ? markPx * (1 + slippageBps / 10000) : markPx * (1 - slippageBps / 10000);
		}

		const szDecimals = market.szDecimals ?? 0;
		const formattedPrice = formatPriceForOrder(orderPrice);
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		const orderId = addOrder({ market: market.coin, side, size: formattedSize, status: "pending" });

		try {
			const result = await placeOrder({
				orders: [
					{
						a: market.assetIndex,
						b: side === "buy",
						p: formattedPrice,
						s: formattedSize,
						r: false,
						t: type === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: "Gtc" as const } },
					},
				],
				grouping: "na",
			});

			throwIfResponseError(result.response?.data?.statuses?.[0]);

			updateOrder(orderId, { status: "success", fillPercent: 100 });
			setSizeInput("");
			setLimitPriceInput("");
		} catch (error) {
			updateOrder(orderId, {
				status: "failed",
				error: error instanceof Error ? error.message : ORDER_TEXT.ORDER_ERROR_FALLBACK,
			});
		}
	};

	const sliderValue = !maxSize || maxSize <= 0 ? 0 : Math.min(100, (sizeValue / maxSize) * 100);

	const buttonContent = (() => {
		if (!isConnected)
			return {
				text: ORDER_TEXT.BUTTON_CONNECT,
				action: () => setWalletDialogOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		if (needsChainSwitch)
			return {
				text: isSwitchingChain ? ORDER_TEXT.BUTTON_SWITCHING : ORDER_TEXT.BUTTON_SWITCH_CHAIN,
				action: handleSwitchChain,
				disabled: isSwitchingChain,
				variant: "cyan" as const,
			};
		if (availableBalance <= 0)
			return {
				text: ORDER_TEXT.BUTTON_DEPOSIT,
				action: () => setDepositModalOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		if (validation.needsApproval)
			return {
				text: isRegistering
					? ORDER_TEXT.BUTTON_SIGNING
					: !canApprove
						? ORDER_TEXT.BUTTON_LOADING
						: ORDER_TEXT.BUTTON_ENABLE_TRADING,
				action: handleApprove,
				disabled: isRegistering || !canApprove,
				variant: "cyan" as const,
			};
		return {
			text: side === "buy" ? ORDER_TEXT.BUTTON_BUY : ORDER_TEXT.BUTTON_SELL,
			action: handleSubmit,
			disabled: !validation.canSubmit || isSubmitting,
			variant: side as "buy" | "sell",
		};
	})();

	const isFormDisabled = !isConnected || availableBalance <= 0;

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-surface/20", className)}>
			{/* Market info header */}
			<div className="shrink-0 px-4 py-3 border-b border-border/60 bg-surface/30">
				{isMarketLoading ? (
					<div className="flex items-center justify-between">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-6 w-20" />
					</div>
				) : (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-lg font-semibold">{market?.coin ?? "—"}</span>
							<span className="text-xs text-muted-foreground">PERP</span>
						</div>
						<div className="text-right">
							<div className="text-lg font-semibold tabular-nums text-terminal-amber">{formatUSD(markPx || null)}</div>
						</div>
					</div>
				)}
			</div>

			{/* Order form - scrollable */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-4 space-y-4">
					{/* Buy/Sell toggle */}
					<div className="grid grid-cols-2 gap-2">
						<Button
							variant="ghost"
							size="none"
							onClick={() => setSide("buy")}
							className={cn(
								"py-4 text-base font-semibold uppercase tracking-wider border rounded-md gap-2 hover:bg-transparent",
								"active:scale-98",
								side === "buy"
									? "bg-terminal-green/20 border-terminal-green text-terminal-green"
									: "border-border/60 text-muted-foreground hover:border-terminal-green/40",
							)}
						>
							<TrendingUp className="size-5" />
							{ORDER_TEXT.BUY_LABEL}
						</Button>
						<Button
							variant="ghost"
							size="none"
							onClick={() => setSide("sell")}
							className={cn(
								"py-4 text-base font-semibold uppercase tracking-wider border rounded-md gap-2 hover:bg-transparent",
								"active:scale-98",
								side === "sell"
									? "bg-terminal-red/20 border-terminal-red text-terminal-red"
									: "border-border/60 text-muted-foreground hover:border-terminal-red/40",
							)}
						>
							<TrendingDown className="size-5" />
							{ORDER_TEXT.SELL_LABEL}
						</Button>
					</div>

					{/* Order type tabs */}
					<div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
						<Button
							variant="ghost"
							size="none"
							onClick={() => setType("market")}
							className={cn(
								"flex-1 py-2.5 text-sm font-medium rounded hover:bg-transparent",
								type === "market" ? "bg-background text-terminal-cyan shadow-sm" : "text-muted-foreground",
							)}
						>
							{ORDER_TEXT.ORDER_TYPE_MARKET}
						</Button>
						<Button
							variant="ghost"
							size="none"
							onClick={() => setType("limit")}
							className={cn(
								"flex-1 py-2.5 text-sm font-medium rounded hover:bg-transparent",
								type === "limit" ? "bg-background text-terminal-cyan shadow-sm" : "text-muted-foreground",
							)}
						>
							{ORDER_TEXT.ORDER_TYPE_LIMIT}
						</Button>
					</div>

					{/* Leverage and balance */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">Leverage</span>
							<LeverageControl key={market?.marketKey} />
						</div>
						<div className="text-right">
							<span className="text-muted-foreground">{ORDER_TEXT.AVAILABLE_LABEL}: </span>
							<span className={cn("tabular-nums font-medium", availableBalance > 0 ? "text-terminal-green" : "")}>
								{isConnected ? formatUSD(availableBalance) : FALLBACK_VALUE_PLACEHOLDER}
							</span>
						</div>
					</div>

					{/* Size input */}
					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">{ORDER_TEXT.SIZE_LABEL}</p>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="none"
								onClick={handleSizeModeToggle}
								className={cn(
									"px-3 py-3 text-sm border border-border/60 rounded-md gap-1 min-h-[48px] hover:bg-transparent",
									"hover:border-foreground/30",
								)}
								disabled={isFormDisabled}
							>
								{sizeMode === "asset" ? market?.coin || "—" : "USD"}
								<ChevronDown className="size-3" />
							</Button>
							<Input
								type="text"
								inputMode="decimal"
								placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
								value={sizeInput}
								onChange={(e) => setSizeInput(e.target.value)}
								className={cn(
									"flex-1 h-12 text-base tabular-nums",
									"bg-background/50 border-border/60",
									"focus:border-terminal-cyan/60",
								)}
								disabled={isFormDisabled}
							/>
						</div>

						{/* Slider */}
						<Slider
							value={[sliderValue]}
							onValueChange={handleSliderChange}
							max={100}
							step={1}
							className="py-2"
							disabled={isFormDisabled || maxSize <= 0}
						/>

						{/* Percent buttons */}
						<div className="grid grid-cols-4 gap-2">
							{ORDER_SIZE_PERCENT_STEPS.map((p) => (
								<Button
									key={p}
									variant="terminal"
									size="none"
									onClick={() => handlePercentClick(p)}
									className="py-2.5 text-sm font-medium rounded-md min-h-[44px]"
									disabled={isFormDisabled || maxSize <= 0}
								>
									{p === 100 ? ORDER_TEXT.SIZE_MAX_LABEL : `${p}%`}
								</Button>
							))}
						</div>
					</div>

					{/* Limit price */}
					{type === "limit" && (
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<p className="text-sm text-muted-foreground">{ORDER_TEXT.LIMIT_PRICE_LABEL}</p>
								{markPx > 0 && (
									<Button
										variant="link"
										size="none"
										onClick={handleMarkPriceClick}
										className="text-xs text-terminal-cyan"
									>
										{ORDER_TEXT.MARK_PRICE_LABEL}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
									</Button>
								)}
							</div>
							<Input
								type="text"
								inputMode="decimal"
								placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
								value={limitPriceInput}
								onChange={(e) => setLimitPriceInput(e.target.value)}
								className="h-12 text-base tabular-nums bg-background/50"
								disabled={isFormDisabled}
							/>
						</div>
					)}

					{/* Error messages */}
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
						<div className="text-sm text-terminal-red">{validation.errors.join(" • ")}</div>
					)}
					{approvalError && <div className="text-sm text-terminal-red">{approvalError}</div>}

					{/* Order summary */}
					<div className="border border-border/40 rounded-md divide-y divide-border/40 text-sm">
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_ORDER_VALUE}
							value={orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}
						/>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_MARGIN_REQ}
							value={marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
						/>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_LIQ}
							value={liqPrice ? formatPrice(liqPrice, { szDecimals: market?.szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
							valueClass="text-terminal-red/70"
						/>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_FEE}
							value={estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
							valueClass="text-muted-foreground"
						/>
					</div>
				</div>
			</div>

			{/* Sticky submit button */}
			<div className="shrink-0 p-4 border-t border-border/60 bg-background/95 backdrop-blur-sm">
				<Button
					variant="ghost"
					size="none"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn(
						"w-full py-4 text-base font-semibold uppercase tracking-wider border rounded-md gap-2 hover:bg-transparent",
						"active:scale-98",
						buttonContent.variant === "cyan"
							? "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30"
							: buttonContent.variant === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
								: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
					)}
				>
					{(isSubmitting || isRegistering) && <Loader2 className="size-5 animate-spin" />}
					{buttonContent.text}
				</Button>
			</div>

			<MobileBottomNavSpacer />

			{/* Modals */}
			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
			<OrderToast />
		</div>
	);
}

function SummaryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
	return (
		<div className="flex items-center justify-between px-3 py-2.5">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn("tabular-nums", valueClass)}>{value}</span>
		</div>
	);
}
