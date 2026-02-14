import { CaretDownIcon, SpinnerGapIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider, type SliderMark } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_FEE_RATE_MAKER,
	ORDER_FEE_RATE_TAKER,
	ORDER_MIN_NOTIONAL_USD,
	UI_TEXT,
} from "@/config/constants";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";
import { getBaseQuoteFromPairName } from "@/domain/market";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useAgentRegistration, useAgentStatus, useSelectedMarketInfo } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { floorToDecimals, formatDecimalFloor, getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import {
	getTabsOrderType,
	isTakerOrderType,
	type OrderType,
	usesLimitPrice as usesLimitPriceForOrder,
} from "@/lib/trade/order-types";
import type { Side, SizeMode } from "@/lib/trade/types";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { WalletDialog } from "../../components/wallet-dialog";
import { AdvancedOrderDropdown } from "../../tradebox/advanced-order-dropdown";
import { LeverageControl } from "../../tradebox/leverage-control";
import { OrderToast } from "../../tradebox/order-toast";

const ORDER_TEXT = UI_TEXT.ORDER_ENTRY;
const SIZE_MARKS: SliderMark[] = [{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }];

interface Props {
	className?: string;
}

export function MobileTradeView({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedMarketInfo();
	const { baseToken, quoteToken } = market
		? getBaseQuoteFromPairName(market.pairName, market.kind)
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

	const [orderType, setOrderType] = useState<OrderType>("market");
	const [side, setSide] = useState<Side>("buy");
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("quote");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [approvalError, setApprovalError] = useState<string | null>(null);

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const { open: openDepositModal } = useDepositModalActions();

	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchangeOrder();

	const tabsOrderType = getTabsOrderType(orderType);
	const isAdvancedTab = tabsOrderType === "advanced";
	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const isMarketExecution = orderType === "market" || isTakerOrderType(orderType);

	useEffect(() => {
		if (selectedPrice !== null) {
			setOrderType("limit");
			setLimitPriceInput(String(selectedPrice));
			getOrderbookActionsStore().actions.clearSelectedPrice();
		}
	}, [selectedPrice]);

	const accountValue = toNumberOrZero(perpSummary?.accountValue);
	const marginUsed = toNumberOrZero(perpSummary?.totalMarginUsed);
	const availableBalance = Math.max(0, accountValue - marginUsed);

	const position =
		!perpPositions.length || !baseToken ? null : (perpPositions.find((p) => p.position.coin === baseToken) ?? null);
	const positionSize = toNumberOrZero(position?.position?.szi);

	const markPx = toNumberOrZero(market?.markPx);
	const price = isMarketExecution ? markPx : toNumberOrZero(limitPriceInput);

	const maxSize = getMaxSize(
		price,
		side,
		maxTradeSzs,
		leverage,
		availableBalance,
		positionSize,
		market?.szDecimals ?? 0,
	);

	const sizeInputValue = toNumberOrZero(sizeInput);
	const sizeValue = sizeMode === "quote" && price > 0 ? sizeInputValue / price : sizeInputValue;
	const orderValue = sizeValue * price;
	const marginRequired = leverage ? orderValue / leverage : 0;
	const feeRate = isMarketExecution ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
	const estimatedFee = orderValue * feeRate;

	const liqPrice = (() => {
		if (!price || !sizeValue || !leverage) return null;
		const buffer = price * (1 / leverage) * 0.9;
		return side === "buy" ? price - buffer : price + buffer;
	})();

	const canSign = isAgentApproved || !!walletClient;

	const validation = (() => {
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
		if (isMarketExecution && !markPx)
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARK_PRICE], canSubmit: false, needsApproval: false };
		if (usesLimitPrice && !price) errors.push(ORDER_TEXT.ERROR_LIMIT_PRICE);
		if (!sizeValue || sizeValue <= 0) errors.push(ORDER_TEXT.ERROR_SIZE);
		if (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD) errors.push(ORDER_TEXT.ERROR_MIN_NOTIONAL);
		if (sizeValue > maxSize && maxSize > 0) errors.push(ORDER_TEXT.ERROR_EXCEEDS_MAX);
		return { valid: errors.length === 0, errors, canSubmit: errors.length === 0, needsApproval: false };
	})();

	function applySizeFromPercent(pct: number) {
		if (maxSize <= 0) return;
		const newSize = maxSize * (pct / 100);
		if (sizeMode === "quote" && price > 0) {
			const quoteValue = newSize * price;
			setSizeInput(quoteValue > 0 ? quoteValue.toFixed(2) : "");
		} else {
			const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
			setSizeInput(formatted || "");
		}
	}

	function handleSliderChange(values: number[]) {
		applySizeFromPercent(values[0]);
	}

	function handleSizeModeToggle() {
		if (sizeMode === "base" && price > 0 && sizeValue > 0) {
			setSizeInput((sizeValue * price).toFixed(2));
			setSizeMode("quote");
		} else if (sizeMode === "quote" && price > 0 && sizeValue > 0) {
			setSizeInput(formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "");
			setSizeMode("base");
		} else {
			setSizeMode(sizeMode === "base" ? "quote" : "base");
		}
	}

	function handleMarkPriceClick() {
		if (markPx > 0) setLimitPriceInput(markPx.toFixed(szDecimalsToPriceDecimals(market?.szDecimals ?? 4)));
	}

	function handleSwitchChain() {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}

	async function handleApprove() {
		if (isRegistering) return;
		setApprovalError(null);
		try {
			await registerAgent();
		} catch (error) {
			setApprovalError(error instanceof Error ? error.message : ORDER_TEXT.APPROVAL_ERROR_FALLBACK);
		}
	}

	async function handleSubmit() {
		if (!validation.canSubmit || isSubmitting) return;
		if (!market || !baseToken || typeof market.assetId !== "number") return;

		let orderPrice = price;
		if (isMarketExecution) {
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
			orderType: isMarketExecution ? "market" : "limit",
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
						t: isMarketExecution ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: "Gtc" as const } },
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
	}

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
				text: getApprovalButtonText(isRegistering, canApprove),
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
		<div className={cn("flex flex-col h-full min-h-0 bg-surface-execution/20", className)}>
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-3 space-y-4">
					<Tabs
						value={tabsOrderType}
						onValueChange={(v) => {
							if (v === "market") setOrderType("market");
							else if (v === "limit") setOrderType("limit");
						}}
					>
						<TabsList variant="underline" className="w-full">
							<TabsTrigger value="market" className="flex-1 text-xs normal-case">
								Market
							</TabsTrigger>
							<TabsTrigger value="limit" className="flex-1 text-xs normal-case">
								Limit
							</TabsTrigger>
							<div className="relative inline-flex flex-1 items-center justify-center pb-2">
								<AdvancedOrderDropdown
									orderType={orderType}
									onOrderTypeChange={setOrderType}
									marketKind={market?.kind}
									className={cn("text-xs normal-case", isAdvancedTab ? "font-semibold text-text-950" : "text-text-600")}
								/>
								{isAdvancedTab && <span aria-hidden className="absolute bottom-0 inset-x-0 h-0.5 bg-primary-default" />}
							</div>
						</TabsList>
					</Tabs>
					<Tabs value={side} onValueChange={(v) => setSide(v as Side)}>
						<TabsList variant="pill" className="w-full">
							<TabsTrigger
								value="buy"
								className="flex-1 text-sm data-[state=active]:text-market-up-600"
								aria-label="Buy Long"
							>
								<TrendUpIcon className="size-4" />
								Long
							</TabsTrigger>
							<TabsTrigger
								value="sell"
								className="flex-1 text-sm data-[state=active]:text-market-down-600"
								aria-label="Sell Short"
							>
								<TrendDownIcon className="size-4" />
								Short
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<div className="flex items-center justify-between text-xs">
						<div className="flex items-center gap-2">
							<span className="text-text-600">Leverage</span>
							<LeverageControl key={market?.name} />
						</div>
						<div className="text-right">
							<span className="text-text-600">{ORDER_TEXT.AVAILABLE_LABEL}: </span>
							<span className={cn("tabular-nums font-medium", getValueColorClass(availableBalance))}>
								{isConnected ? formatUSD(availableBalance) : FALLBACK_VALUE_PLACEHOLDER}
							</span>
						</div>
					</div>
					<div className="space-y-1.5">
						<p className="text-xs text-text-600">{ORDER_TEXT.SIZE_LABEL}</p>
						<div className="flex items-center gap-2">
							<Button
								variant="text"
								size="none"
								onClick={handleSizeModeToggle}
								className={cn(
									"px-3 py-2.5 text-xs border border-border-200/60 rounded-xs gap-1 hover:bg-transparent",
									"hover:border-text-400",
								)}
								disabled={isFormDisabled}
							>
								{sizeMode === "base" ? baseToken || "\u2014" : quoteToken || "\u2014"}
								<CaretDownIcon className="size-3" />
							</Button>
							<Input
								type="text"
								inputMode="decimal"
								placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
								value={sizeInput}
								onChange={(e) => setSizeInput(e.target.value)}
								className={cn(
									"flex-1 h-10 text-base tabular-nums",
									"bg-surface-base/50 border-border-200/60",
									"focus:border-primary-default/60",
								)}
								disabled={isFormDisabled}
							/>
						</div>
						<Slider
							value={[sliderValue]}
							onValueChange={handleSliderChange}
							max={100}
							step={1}
							marks={SIZE_MARKS}
							className="py-3"
							disabled={isFormDisabled || maxSize <= 0}
						/>
					</div>
					{usesLimitPrice && (
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<p className="text-xs text-text-600">{ORDER_TEXT.LIMIT_PRICE_LABEL}</p>
								{markPx > 0 && (
									<Button
										variant="text"
										size="none"
										onClick={handleMarkPriceClick}
										className="text-3xs text-primary-default"
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
								className="h-10 text-base tabular-nums bg-surface-base/50"
								disabled={isFormDisabled}
							/>
						</div>
					)}
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
						<div className="text-xs text-market-down-600">{validation.errors.join(" \u2022 ")}</div>
					)}
					{approvalError && <div className="text-xs text-market-down-600">{approvalError}</div>}
					<div className="border border-border-200/40 rounded-xs divide-y divide-border/40 text-xs">
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
							valueClass="text-market-down-600"
						/>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_FEE}
							value={estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
							valueClass="text-text-600"
						/>
					</div>
				</div>
			</div>
			<div className="shrink-0 p-4 border-t border-border-200/60 bg-surface-base/95 backdrop-blur-sm">
				<Button
					variant="outlined"
					size="lg"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn("w-full py-3.5 text-base font-semibold", getButtonVariantClass(buttonContent.variant))}
				>
					{(isSubmitting || isRegistering) && <SpinnerGapIcon className="size-5 animate-spin" />}
					{buttonContent.text}
				</Button>
			</div>

			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<OrderToast />
		</div>
	);
}

interface SummaryRowProps {
	label: string;
	value: string;
	valueClass?: string;
}

function SummaryRow({ label, value, valueClass }: SummaryRowProps) {
	return (
		<div className="flex items-center justify-between px-3 py-2.5">
			<span className="text-text-600">{label}</span>
			<span className={cn("tabular-nums", valueClass)}>{value}</span>
		</div>
	);
}

function getMaxSize(
	price: number,
	side: Side,
	maxTradeSzs: [number, number] | null | undefined,
	leverage: number | undefined,
	availableBalance: number,
	positionSize: number,
	szDecimals: number,
): number {
	if (!price || price <= 0) return 0;

	const isBuy = side === "buy";
	const maxTradeSize = maxTradeSzs?.[isBuy ? 0 : 1] ?? 0;
	if (maxTradeSize > 0) return floorToDecimals(maxTradeSize, szDecimals);

	if (!leverage || availableBalance <= 0) return 0;
	const maxNotional = availableBalance * leverage;
	let maxSizeRaw = maxNotional / price;
	if (!isBuy && positionSize > 0) maxSizeRaw += positionSize;
	else if (isBuy && positionSize < 0) maxSizeRaw += Math.abs(positionSize);
	return floorToDecimals(maxSizeRaw, szDecimals);
}

function getApprovalButtonText(isRegistering: boolean, canApprove: boolean): string {
	if (isRegistering) return ORDER_TEXT.BUTTON_SIGNING;
	if (!canApprove) return ORDER_TEXT.BUTTON_LOADING;
	return ORDER_TEXT.BUTTON_ENABLE_TRADING;
}

function getButtonVariantClass(variant: "cyan" | "buy" | "sell"): string {
	if (variant === "cyan")
		return "bg-primary-default/20 border-primary-default text-primary-default hover:bg-primary-default/30";
	if (variant === "buy") return "bg-market-up-100 border-market-up-600 text-market-up-600 hover:bg-market-up-100/30";
	return "bg-market-down-100 border-market-down-600 text-market-down-600 hover:bg-market-down-600/30";
}
