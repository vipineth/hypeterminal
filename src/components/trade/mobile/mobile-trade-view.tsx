import { CaretDownIcon, SpinnerGapIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_FEE_RATE_MAKER,
	ORDER_FEE_RATE_TAKER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
	UI_TEXT,
} from "@/config/constants";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";
import { getBaseQuoteFromDisplayName } from "@/domain/market";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useAgentRegistration, useAgentStatus, useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { floorToDecimals, formatDecimalFloor, getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import type { SizeMode } from "@/lib/trade/types";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { WalletDialog } from "../components/wallet-dialog";
import { LeverageControl } from "../tradebox/leverage-control";
import { OrderToast } from "../tradebox/order-toast";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";

const ORDER_TEXT = UI_TEXT.ORDER_ENTRY;

interface MobileTradeViewProps {
	className?: string;
}

export function MobileTradeView({ className }: MobileTradeViewProps) {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market, isLoading: isMarketLoading } = useSelectedMarketInfo();
	const { baseToken, quoteToken } = market
		? getBaseQuoteFromDisplayName(market.displayName, market.kind)
		: { baseToken: undefined, quoteToken: undefined };

	const { perpSummary, perpPositions } = useAccountBalances();

	const { isReady: isAgentApproved } = useAgentStatus();
	const { register: registerAgent, status: registerStatus } = useAgentRegistration();

	const canApprove = !!walletClient && !!address;
	const isRegistering =
		registerStatus === "approving_fee" || registerStatus === "approving_agent" || registerStatus === "verifying";

	const slippageBps = useMarketOrderSlippageBps();

	const { displayLeverage: leverage, maxTradeSzs } = useAssetLeverage();

	const { addOrder, updateOrder } = useOrderQueueActions();
	const selectedPrice = useSelectedPrice();

	const [type, setType] = useState<OrderType>("market");
	const [side, setSide] = useState<Side>("buy");
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("quote");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [approvalError, setApprovalError] = useState<string | null>(null);

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const { open: openDepositModal } = useDepositModalActions();

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
	const accountValue = toNumberOrZero(perpSummary?.accountValue);
	const marginUsed = toNumberOrZero(perpSummary?.totalMarginUsed);
	const availableBalance = Math.max(0, accountValue - marginUsed);

	const position =
		!perpPositions.length || !baseToken ? null : (perpPositions.find((p) => p.position.coin === baseToken) ?? null);
	const positionSize = toNumberOrZero(position?.position?.szi);

	const markPx = market?.markPx ?? 0;
	const price = type === "market" ? markPx : toNumberOrZero(limitPriceInput);

	const maxSize = useMemo(() => {
		if (!price || price <= 0) return 0;

		const isBuy = side === "buy";
		const maxTradeSize = maxTradeSzs?.[isBuy ? 0 : 1] ?? 0;
		if (maxTradeSize > 0) {
			return floorToDecimals(maxTradeSize, market?.szDecimals ?? 0);
		}

		if (!leverage || availableBalance <= 0) return 0;
		const maxNotional = availableBalance * leverage;
		let maxSizeRaw = maxNotional / price;
		if (!isBuy && positionSize > 0) maxSizeRaw += positionSize;
		else if (isBuy && positionSize < 0) maxSizeRaw += Math.abs(positionSize);
		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
	}, [price, side, maxTradeSzs, leverage, availableBalance, positionSize, market?.szDecimals]);

	const sizeInputValue = toNumberOrZero(sizeInput);
	const sizeValue = sizeMode === "quote" && price > 0 ? sizeInputValue / price : sizeInputValue;
	const orderValue = sizeValue * price;
	const marginRequired = leverage ? orderValue / leverage : 0;
	const feeRate = type === "market" ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
	const estimatedFee = orderValue * feeRate;

	const liqPrice = (() => {
		if (!price || !sizeValue || !leverage) return null;
		const buffer = price * (1 / leverage) * 0.9;
		return side === "buy" ? price - buffer : price + buffer;
	})();

	const canSign = isAgentApproved || !!walletClient;

	const validation = useMemo(() => {
		const errors: string[] = [];
		if (!isConnected)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NOT_CONNECTED], canSubmit: false, needsApproval: false };
		if (isWalletLoading)
			return { valid: false, errors: [ORDER_TEXT.ERROR_LOADING_WALLET], canSubmit: false, needsApproval: false };
		if (availableBalance <= 0)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_BALANCE], canSubmit: false, needsApproval: false };
		if (!market) return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARKET], canSubmit: false, needsApproval: false };
		if (typeof market.assetId !== "number")
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
		if (sizeMode === "quote" && price > 0) {
			const quoteValue = newSize * price;
			setSizeInput(quoteValue > 0 ? quoteValue.toFixed(2) : "");
		} else {
			const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
			setSizeInput(formatted || "");
		}
	};

	const handleSliderChange = (values: number[]) => applySizeFromPercent(values[0]);
	const handlePercentClick = (pct: number) => applySizeFromPercent(pct);

	const handleSizeModeToggle = () => {
		if (sizeMode === "base" && price > 0 && sizeValue > 0) {
			setSizeInput((sizeValue * price).toFixed(2));
			setSizeMode("quote");
		} else if (sizeMode === "quote" && price > 0 && sizeValue > 0) {
			setSizeInput(formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "");
			setSizeMode("base");
		} else {
			setSizeMode(sizeMode === "base" ? "quote" : "base");
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
		if (!market || !baseToken || typeof market.assetId !== "number") return;

		let orderPrice = price;
		if (type === "market") {
			orderPrice = side === "buy" ? markPx * (1 + slippageBps / 10000) : markPx * (1 - slippageBps / 10000);
		}

		const szDecimals = market.szDecimals ?? 0;
		const formattedPrice = formatPriceForOrder(orderPrice);
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		const orderId = addOrder({
			market: baseToken,
			side,
			size: formattedSize,
			price: formattedPrice,
			orderType: type === "market" ? "market" : "limit",
			status: "pending",
		});

		try {
			const result = await placeOrder({
				orders: [
					{
						a: market.assetId,
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
				action: () => openDepositModal("deposit"),
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
							<span className="text-lg font-semibold">{baseToken ?? "—"}</span>
							<span className="text-xs text-muted-fg">PERP</span>
						</div>
						<div className="text-right">
							<div className="text-lg font-semibold tabular-nums text-warning">{formatUSD(markPx || null)}</div>
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
									? "bg-positive/20 border-positive text-positive"
									: "border-border/60 text-muted-fg hover:border-positive/40",
							)}
						>
							<TrendUpIcon className="size-5" />
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
									? "bg-negative/20 border-negative text-negative"
									: "border-border/60 text-muted-fg hover:border-negative/40",
							)}
						>
							<TrendDownIcon className="size-5" />
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
								type === "market" ? "bg-bg text-info shadow-sm" : "text-muted-fg",
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
								type === "limit" ? "bg-bg text-info shadow-sm" : "text-muted-fg",
							)}
						>
							{ORDER_TEXT.ORDER_TYPE_LIMIT}
						</Button>
					</div>

					{/* Leverage and balance */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex items-center gap-2">
							<span className="text-muted-fg">Leverage</span>
							<LeverageControl key={market?.name} />
						</div>
						<div className="text-right">
							<span className="text-muted-fg">{ORDER_TEXT.AVAILABLE_LABEL}: </span>
							<span className={cn("tabular-nums font-medium", getValueColorClass(availableBalance))}>
								{isConnected ? formatUSD(availableBalance) : FALLBACK_VALUE_PLACEHOLDER}
							</span>
						</div>
					</div>

					{/* Size input */}
					<div className="space-y-2">
						<p className="text-sm text-muted-fg">{ORDER_TEXT.SIZE_LABEL}</p>
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="none"
								onClick={handleSizeModeToggle}
								className={cn(
									"px-3 py-3 text-sm border border-border/60 rounded-md gap-1 min-h-[48px] hover:bg-transparent",
									"hover:border-fg/30",
								)}
								disabled={isFormDisabled}
							>
								{sizeMode === "base" ? baseToken || "—" : quoteToken || "—"}
								<CaretDownIcon className="size-3" />
							</Button>
							<Input
								type="text"
								inputMode="decimal"
								placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
								value={sizeInput}
								onChange={(e) => setSizeInput(e.target.value)}
								className={cn(
									"flex-1 h-12 text-base tabular-nums",
									"bg-bg/50 border-border/60",
									"focus:border-info/60",
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
								<p className="text-sm text-muted-fg">{ORDER_TEXT.LIMIT_PRICE_LABEL}</p>
								{markPx > 0 && (
									<Button variant="link" size="none" onClick={handleMarkPriceClick} className="text-xs text-info">
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
								className="h-12 text-base tabular-nums bg-bg/50"
								disabled={isFormDisabled}
							/>
						</div>
					)}

					{/* Error messages */}
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
						<div className="text-sm text-negative">{validation.errors.join(" • ")}</div>
					)}
					{approvalError && <div className="text-sm text-negative">{approvalError}</div>}

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
							valueClass="text-negative/70"
						/>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_FEE}
							value={estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
							valueClass="text-muted-fg"
						/>
					</div>
				</div>
			</div>

			{/* Sticky submit button */}
			<div className="shrink-0 p-4 border-t border-border/60 bg-bg/95 backdrop-blur-sm">
				<Button
					variant="ghost"
					size="none"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn(
						"w-full py-4 text-base font-semibold uppercase tracking-wider border rounded-md gap-2 hover:bg-transparent",
						"active:scale-98",
						buttonContent.variant === "cyan"
							? "bg-info/20 border-info text-info hover:bg-info/30"
							: buttonContent.variant === "buy"
								? "bg-positive/20 border-positive text-positive hover:bg-positive/30"
								: "bg-negative/20 border-negative text-negative hover:bg-negative/30",
					)}
				>
					{(isSubmitting || isRegistering) && <SpinnerGapIcon className="size-5 animate-spin" />}
					{buttonContent.text}
				</Button>
			</div>

			<MobileBottomNavSpacer />

			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<OrderToast />
		</div>
	);
}

function SummaryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
	return (
		<div className="flex items-center justify-between px-3 py-2.5">
			<span className="text-muted-fg">{label}</span>
			<span className={cn("tabular-nums", valueClass)}>{value}</span>
		</div>
	);
}
