import { ChevronDown, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
// Note: useEffect still used for selectedPrice sync (store-driven, will fix in Phase 2)
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	ARBITRUM_CHAIN_ID,
	DEFAULT_MAX_LEVERAGE,
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_FEE_RATE_MAKER,
	ORDER_FEE_RATE_TAKER,
	ORDER_LEVERAGE_STEPS,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
	UI_TEXT,
} from "@/constants/app";
import { useClearinghouseState } from "@/hooks/hyperliquid/use-clearinghouse-state";
import { useSelectedResolvedMarket } from "@/hooks/hyperliquid/use-resolved-market";
import { useTradingAgent } from "@/hooks/hyperliquid/use-trading-agent";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { ensureLeverage, makeExchangeConfig, placeSingleOrder } from "@/lib/hyperliquid/exchange";
import { floorToDecimals, formatDecimalFloor, parseNumber } from "@/lib/trade/numbers";
import { formatPriceForOrder, formatSizeForOrder, getDefaultLeverage } from "@/lib/trade/orders";
import { cn } from "@/lib/utils";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { useOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import {
	useDefaultLeverageByMode,
	useMarketLeverageByMode,
	useMarketOrderSlippageBps,
	useTradeSettingsActions,
} from "@/stores/use-trade-settings-store";
import { WalletDialog } from "../components/wallet-dialog";
import { DepositModal } from "./deposit-modal";
import { OrderToast } from "./order-toast";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";
type SizeMode = "asset" | "usd";

const ORDER_TEXT = UI_TEXT.ORDER_ENTRY;

export function OrderEntryPanel() {
	const reduceOnlyId = useId();
	const tpSlId = useId();

	const { address, isConnected } = useConnection();

	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const { data: clearinghouse } = useClearinghouseState({ user: address });

	const {
		isApproved: isAgentApproved,
		apiWalletSigner,
		approveAgent,
		canApprove,
	} = useTradingAgent({
		user: address,
		walletClient,
		enabled: isConnected,
	});

	const defaultLeverageByMode = useDefaultLeverageByMode();
	const marketLeverageByMode = useMarketLeverageByMode();
	const slippageBps = useMarketOrderSlippageBps();
	const { setMarketLeverage } = useTradeSettingsActions();

	const { addOrder, updateOrder } = useOrderQueueActions();

	const selectedPrice = useSelectedPrice();

	const [type, setType] = useState<OrderType>("market");
	const [side, setSide] = useState<Side>("buy");
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("asset");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isApproving, setIsApproving] = useState(false);
	const [approvalError, setApprovalError] = useState<string | null>(null);

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);

	// React 19: Form reset handled by key prop from OrderSidebar

	// Valid useEffect: Cross-component event from orderbook price click
	// This responds to user action in another component (similar to external event)
	useEffect(() => {
		if (selectedPrice !== null) {
			setType("limit");
			setLimitPriceInput(String(selectedPrice));
			useOrderbookActionsStore.getState().clearSelectedPrice();
		}
	}, [selectedPrice]);

	// React 19: Simple arithmetic - no useMemo needed
	const accountValue = parseNumber(clearinghouse?.crossMarginSummary?.accountValue) || 0;
	const marginUsed = parseNumber(clearinghouse?.crossMarginSummary?.totalMarginUsed) || 0;
	const availableBalance = Math.max(0, accountValue - marginUsed);

	const position = useMemo(() => {
		if (!clearinghouse?.assetPositions || !market?.coin) return null;
		return clearinghouse.assetPositions.find((p) => p.position.coin === market.coin);
	}, [clearinghouse?.assetPositions, market?.coin]);

	// React 19: Simple parsing - no useMemo needed
	const positionSize = parseNumber(position?.position?.szi) || 0;

	const maxLeverage = market?.maxLeverage || DEFAULT_MAX_LEVERAGE;

	const leverage = useMemo(() => {
		if (!market?.marketKey) return getDefaultLeverage(maxLeverage);
		const marketSpecific = marketLeverageByMode[market.marketKey]?.cross;
		if (marketSpecific) return Math.min(marketSpecific, maxLeverage);
		const defaultLev = defaultLeverageByMode.cross ?? getDefaultLeverage(maxLeverage);
		return Math.min(defaultLev, maxLeverage);
	}, [market?.marketKey, marketLeverageByMode, defaultLeverageByMode.cross, maxLeverage]);

	const markPx = useMemo(() => {
		const ctxMarkPx = market?.ctxNumbers?.markPx;
		if (typeof ctxMarkPx === "number") return ctxMarkPx;
		const midPx = market?.midPxNumber;
		return typeof midPx === "number" ? midPx : 0;
	}, [market?.ctxNumbers?.markPx, market?.midPxNumber]);

	const price = useMemo(() => {
		if (type === "market") return markPx;
		return parseNumber(limitPriceInput) || 0;
	}, [type, markPx, limitPriceInput]);

	const maxSize = useMemo(() => {
		if (!price || price <= 0 || !leverage) return 0;
		const maxNotional = availableBalance * leverage;
		let maxSizeRaw = maxNotional / price;

		if (side === "sell" && positionSize > 0) {
			maxSizeRaw += positionSize;
		} else if (side === "buy" && positionSize < 0) {
			maxSizeRaw += Math.abs(positionSize);
		}

		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
	}, [availableBalance, leverage, price, side, positionSize, market?.szDecimals]);

	// React 19: Simple calculations - no useMemo needed
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

	const liqWarning = liqPrice && price ? Math.abs(liqPrice - price) / price < 0.05 : false;

	const canSign = isAgentApproved ? !!apiWalletSigner : !!walletClient;

	const validation = useMemo(() => {
		const errors: string[] = [];

		if (!isConnected) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_NOT_CONNECTED], canSubmit: false, needsApproval: false };
		}
		if (isWalletLoading) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_LOADING_WALLET], canSubmit: false, needsApproval: false };
		}
		if (availableBalance <= 0) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_BALANCE], canSubmit: false, needsApproval: false };
		}
		if (!market) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARKET], canSubmit: false, needsApproval: false };
		}
		if (typeof market.assetIndex !== "number") {
			return { valid: false, errors: [ORDER_TEXT.ERROR_MARKET_NOT_READY], canSubmit: false, needsApproval: false };
		}

		if (!isAgentApproved) {
			return { valid: false, errors: [], canSubmit: false, needsApproval: true };
		}

		if (!canSign) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_SIGNER_NOT_READY], canSubmit: false, needsApproval: false };
		}
		if (type === "market" && !markPx) {
			return { valid: false, errors: [ORDER_TEXT.ERROR_NO_MARK_PRICE], canSubmit: false, needsApproval: false };
		}
		if (type === "limit" && !price) {
			errors.push(ORDER_TEXT.ERROR_LIMIT_PRICE);
		}
		if (!sizeValue || sizeValue <= 0) {
			errors.push(ORDER_TEXT.ERROR_SIZE);
		}
		if (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD) {
			errors.push(ORDER_TEXT.ERROR_MIN_NOTIONAL);
		}
		if (sizeValue > maxSize && maxSize > 0) {
			errors.push(ORDER_TEXT.ERROR_EXCEEDS_MAX);
		}

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

	const sizeHasError = sizeValue > maxSize && maxSize > 0;
	const orderValueTooLow = orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD;

	const leverageOptions = useMemo(() => {
		const options: number[] = [];
		for (const step of ORDER_LEVERAGE_STEPS) {
			if (step <= maxLeverage) {
				options.push(step);
			}
		}
		if (!options.includes(maxLeverage)) {
			options.push(maxLeverage);
		}
		return options.sort((a, b) => a - b);
	}, [maxLeverage]);

	const handleLeverageChange = useCallback(
		(newLeverage: number) => {
			if (market?.marketKey) {
				setMarketLeverage(market.marketKey, "cross", newLeverage, maxLeverage);
			}
		},
		[market?.marketKey, maxLeverage, setMarketLeverage],
	);

	const applySizeFromPercent = useCallback(
		(pct: number) => {
			if (maxSize <= 0) return;
			const newSize = maxSize * (pct / 100);
			const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
			if (sizeMode === "usd" && price > 0) {
				const usdValue = newSize * price;
				setSizeInput(usdValue > 0 ? usdValue.toFixed(2) : "");
				return;
			}
			setSizeInput(formatted || "");
		},
		[maxSize, market?.szDecimals, sizeMode, price],
	);

	const handleSliderChange = useCallback(
		(values: number[]) => {
			applySizeFromPercent(values[0]);
		},
		[applySizeFromPercent],
	);

	const handlePercentClick = useCallback(
		(pct: number) => {
			applySizeFromPercent(pct);
		},
		[applySizeFromPercent],
	);

	const handleSizeModeToggle = useCallback(() => {
		if (sizeMode === "asset" && price > 0 && sizeValue > 0) {
			const usdValue = sizeValue * price;
			setSizeInput(usdValue.toFixed(2));
			setSizeMode("usd");
		} else if (sizeMode === "usd" && price > 0 && sizeValue > 0) {
			const formatted = formatDecimalFloor(sizeValue, market?.szDecimals ?? 0);
			setSizeInput(formatted || "");
			setSizeMode("asset");
		} else {
			setSizeMode(sizeMode === "asset" ? "usd" : "asset");
		}
	}, [sizeMode, price, sizeValue, market?.szDecimals]);

	const handleMarkPriceClick = useCallback(() => {
		if (markPx > 0) {
			const decimals = szDecimalsToPriceDecimals(market?.szDecimals ?? 4);
			setLimitPriceInput(markPx.toFixed(decimals));
		}
	}, [markPx, market?.szDecimals]);

	const handleSwitchChain = useCallback(() => {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}, [switchChain]);

	const handleApprove = useCallback(async () => {
		if (isApproving) return;

		setIsApproving(true);
		setApprovalError(null);

		try {
			await approveAgent();
		} catch (error) {
			console.error("[OrderEntry] Approval failed:", error);
			const message = error instanceof Error ? error.message : ORDER_TEXT.APPROVAL_ERROR_FALLBACK;
			setApprovalError(message);
		} finally {
			setIsApproving(false);
		}
	}, [isApproving, approveAgent]);

	const handleSubmit = useCallback(async () => {
		if (!validation.canSubmit || isSubmitting) return;
		if (!apiWalletSigner || typeof market?.assetIndex !== "number") return;

		setIsSubmitting(true);

		let orderPrice = price;
		if (type === "market") {
			if (side === "buy") {
				orderPrice = markPx * (1 + slippageBps / 10000);
			} else {
				orderPrice = markPx * (1 - slippageBps / 10000);
			}
		}

		const szDecimals = market.szDecimals ?? 0;
		const formattedPrice = formatPriceForOrder(orderPrice);
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		const orderId = addOrder({
			market: market.coin,
			side,
			size: formattedSize,
			status: "pending",
		});

		try {
			const transport = getHttpTransport();
			const config = makeExchangeConfig(transport, apiWalletSigner);

			await ensureLeverage(config, {
				asset: market.assetIndex,
				isCross: true,
				leverage,
			});

			const order = {
				a: market.assetIndex,
				b: side === "buy",
				p: formattedPrice,
				s: formattedSize,
				r: false,
				t: type === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: "Gtc" as const } },
			};

			const result = await placeSingleOrder(config, { order });

			const status = result.response?.data?.statuses?.[0];
			if (status && "error" in status && typeof status.error === "string") {
				throw new Error(status.error);
			}

			updateOrder(orderId, { status: "success", fillPercent: 100 });

			setSizeInput("");
			setLimitPriceInput("");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : ORDER_TEXT.ORDER_ERROR_FALLBACK;
			updateOrder(orderId, { status: "failed", error: errorMessage });
		} finally {
			setIsSubmitting(false);
		}
	}, [
		validation.canSubmit,
		isSubmitting,
		apiWalletSigner,
		isAgentApproved,
		market,
		type,
		side,
		price,
		markPx,
		slippageBps,
		sizeValue,
		leverage,
		addOrder,
		updateOrder,
	]);

	// const handleKeyDown = useCallback(
	// 	(e: React.KeyboardEvent) => {
	// 		if (e.key === "Enter" && validation.canSubmit && !isSubmitting) {
	// 			handleSubmit();
	// 		}
	// 	},
	// 	[validation.canSubmit, isSubmitting, handleSubmit],
	// );

	// React 19: Simple calculations - no useMemo needed
	const sliderValue = !maxSize || maxSize <= 0 ? 0 : Math.min(100, (sizeValue / maxSize) * 100);

	// React 19: Object literal with conditionals - compiler handles this
	const buttonContent = (() => {
		if (!isConnected) {
			return {
				text: ORDER_TEXT.BUTTON_CONNECT,
				action: () => setWalletDialogOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		}
		if (needsChainSwitch) {
			return {
				text: isSwitchingChain ? ORDER_TEXT.BUTTON_SWITCHING : ORDER_TEXT.BUTTON_SWITCH_CHAIN,
				action: handleSwitchChain,
				disabled: isSwitchingChain,
				variant: "cyan" as const,
			};
		}
		if (availableBalance <= 0) {
			return {
				text: ORDER_TEXT.BUTTON_DEPOSIT,
				action: () => setDepositModalOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		}
		if (validation.needsApproval) {
			return {
				text: isApproving
					? ORDER_TEXT.BUTTON_SIGNING
					: !canApprove
						? ORDER_TEXT.BUTTON_LOADING
						: ORDER_TEXT.BUTTON_ENABLE_TRADING,
				action: handleApprove,
				disabled: isApproving || !canApprove,
				variant: "cyan" as const,
			};
		}
		return {
			text: side === "buy" ? ORDER_TEXT.BUTTON_BUY : ORDER_TEXT.BUTTON_SELL,
			action: handleSubmit,
			disabled: !validation.canSubmit || isSubmitting,
			variant: side as "buy" | "sell",
		};
	})();

	const isFormDisabled = !isConnected || availableBalance <= 0;

	return (
		<div
			className="h-full flex flex-col overflow-hidden bg-surface/20"
			// onKeyDown={handleKeyDown}
		>
			<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
				<Tabs value="cross">
					<TabsList>
						<TabsTrigger value="cross">{ORDER_TEXT.MODE_CROSS}</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="isolated" disabled className="opacity-50 cursor-not-allowed">
										{ORDER_TEXT.MODE_ISOLATED}
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>{ORDER_TEXT.MODE_COMING_SOON}</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-2 py-0.5 text-3xs border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1"
							tabIndex={0}
							aria-label={ORDER_TEXT.LEVERAGE_ARIA}
						>
							{leverage}x <ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-16 font-mono text-xs max-h-48 overflow-y-auto">
						{leverageOptions.map((lv) => (
							<DropdownMenuItem key={lv} onClick={() => handleLeverageChange(lv)} selected={lv === leverage}>
								{lv}x
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="p-2 space-y-2 overflow-y-auto flex-1">
				{/* Order type tabs */}
				<Tabs value={type} onValueChange={(v) => setType(v as OrderType)}>
					<TabsList>
						<TabsTrigger value="market" variant="underline">
							{ORDER_TEXT.ORDER_TYPE_MARKET}
						</TabsTrigger>
						<TabsTrigger value="limit" variant="underline">
							{ORDER_TEXT.ORDER_TYPE_LIMIT}
						</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="stop" variant="underline" disabled className="opacity-50 cursor-not-allowed">
										{ORDER_TEXT.ORDER_TYPE_STOP}
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>{ORDER_TEXT.MODE_COMING_SOON}</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>

				{/* Buy/Sell buttons */}
				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						onClick={() => setSide("buy")}
						className={cn(
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
							side === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green terminal-glow-green"
								: "border-border/60 text-muted-foreground hover:border-terminal-green/40 hover:text-terminal-green",
						)}
						tabIndex={0}
						aria-label={ORDER_TEXT.BUY_ARIA}
					>
						<TrendingUp className="size-3 inline mr-1" />
						{ORDER_TEXT.BUY_LABEL}
					</button>
					<button
						type="button"
						onClick={() => setSide("sell")}
						className={cn(
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
							side === "sell"
								? "bg-terminal-red/20 border-terminal-red text-terminal-red terminal-glow-red"
								: "border-border/60 text-muted-foreground hover:border-terminal-red/40 hover:text-terminal-red",
						)}
						tabIndex={0}
						aria-label={ORDER_TEXT.SELL_ARIA}
					>
						<TrendingDown className="size-3 inline mr-1" />
						{ORDER_TEXT.SELL_LABEL}
					</button>
				</div>

				{/* Balance + Deposit */}
				<div className="space-y-0.5 text-3xs">
					<div className="flex items-center justify-between text-muted-foreground">
						<span>{ORDER_TEXT.AVAILABLE_LABEL}</span>
						<div className="flex items-center gap-2">
							<span
								className={cn("tabular-nums", availableBalance > 0 ? "text-terminal-green" : "text-muted-foreground")}
							>
								{isConnected ? formatUSD(availableBalance) : FALLBACK_VALUE_PLACEHOLDER}
							</span>
							{isConnected && (
								<button
									type="button"
									onClick={() => setDepositModalOpen(true)}
									className="text-terminal-cyan hover:underline text-4xs uppercase"
								>
									{ORDER_TEXT.DEPOSIT_LABEL}
								</button>
							)}
						</div>
					</div>
					{/* Position (if exists) */}
					{positionSize !== 0 && (
						<div className="flex items-center justify-between text-muted-foreground">
							<span>{ORDER_TEXT.POSITION_LABEL}</span>
							<span className={cn("tabular-nums", positionSize > 0 ? "text-terminal-green" : "text-terminal-red")}>
								{positionSize > 0 ? "+" : ""}
								{formatDecimalFloor(positionSize, market?.szDecimals ?? 2)} {market?.coin}
							</span>
						</div>
					)}
				</div>

				{/* Size input */}
				<div className="space-y-1.5">
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">{ORDER_TEXT.SIZE_LABEL}</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handleSizeModeToggle}
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label={ORDER_TEXT.SIZE_MODE_TOGGLE_ARIA}
							disabled={isFormDisabled}
						>
							{sizeMode === "asset" ? market?.coin || ORDER_TEXT.SIZE_MODE_FALLBACK : ORDER_TEXT.SIZE_MODE_USD}{" "}
							<ChevronDown className="size-2.5" />
						</button>
						<Input
							placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
							value={sizeInput}
							onChange={(e) => setSizeInput(e.target.value)}
							className={cn(
								"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								(sizeHasError || orderValueTooLow) && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>

					{/* Slider */}
					<Slider
						value={[sliderValue]}
						onValueChange={handleSliderChange}
						max={100}
						step={0.1}
						className="py-1"
						disabled={isFormDisabled || maxSize <= 0}
					/>

					{/* Percent buttons */}
					<div className="grid grid-cols-4 gap-1">
						{ORDER_SIZE_PERCENT_STEPS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => handlePercentClick(p)}
								className="py-1 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/40 hover:text-terminal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								tabIndex={0}
								aria-label={ORDER_TEXT.PERCENT_ARIA(p)}
								disabled={isFormDisabled || maxSize <= 0}
							>
								{p === 100 ? ORDER_TEXT.SIZE_MAX_LABEL : `${p}%`}
							</button>
						))}
					</div>
				</div>

				{/* Limit price (conditional) */}
				{type === "limit" && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">
								{ORDER_TEXT.LIMIT_PRICE_LABEL}
							</div>
							{markPx > 0 && (
								<button
									type="button"
									onClick={handleMarkPriceClick}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan tabular-nums"
								>
									{ORDER_TEXT.MARK_PRICE_LABEL}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</button>
							)}
						</div>
						<Input
							placeholder={ORDER_TEXT.INPUT_PLACEHOLDER}
							value={limitPriceInput}
							onChange={(e) => setLimitPriceInput(e.target.value)}
							className={cn(
								"h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								type === "limit" && !price && sizeValue > 0 && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{/* Reduce Only + TP/SL (disabled) */}
				<div className="flex items-center gap-3 text-3xs">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="inline-flex items-center gap-1.5 cursor-not-allowed opacity-50">
								<Checkbox id={reduceOnlyId} className="size-3.5" aria-label={ORDER_TEXT.REDUCE_ONLY_LABEL} disabled />
								<label htmlFor={reduceOnlyId} className="text-muted-foreground cursor-not-allowed">
									{ORDER_TEXT.REDUCE_ONLY_LABEL}
								</label>
							</div>
						</TooltipTrigger>
						<TooltipContent>{ORDER_TEXT.MODE_COMING_SOON}</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="inline-flex items-center gap-1.5 cursor-not-allowed opacity-50">
								<Checkbox id={tpSlId} className="size-3.5" aria-label={ORDER_TEXT.TPSL_ARIA} disabled />
								<label htmlFor={tpSlId} className="text-muted-foreground cursor-not-allowed">
									{ORDER_TEXT.TPSL_LABEL}
								</label>
							</div>
						</TooltipTrigger>
						<TooltipContent>{ORDER_TEXT.MODE_COMING_SOON}</TooltipContent>
					</Tooltip>
				</div>

				<div className="h-4" />

				{/* Validation errors */}
				{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
					<div className="text-4xs text-terminal-red">{validation.errors.join(" • ")}</div>
				)}

				{/* Approval error */}
				{approvalError && <div className="text-4xs text-terminal-red">{approvalError}</div>}

				{/* Submit button */}
				<button
					type="button"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					className={cn(
						"w-full py-2.5 text-2xs font-semibold uppercase tracking-wider transition-all border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
						buttonContent.variant === "cyan"
							? "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30"
							: buttonContent.variant === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
								: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
					)}
					tabIndex={0}
					aria-label={buttonContent.text}
				>
					{(isSubmitting || isApproving) && <Loader2 className="size-3 animate-spin" />}
					{buttonContent.text}
				</button>

				{/* Order summary */}
				<div className="border border-border/40 divide-y divide-border/40 text-3xs">
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{ORDER_TEXT.SUMMARY_LIQ}</span>
						<span className={cn("tabular-nums", liqWarning ? "text-terminal-red" : "text-terminal-red/70")}>
							{liqPrice ? formatPrice(liqPrice, { szDecimals: market?.szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{ORDER_TEXT.SUMMARY_ORDER_VALUE}</span>
						<span className="tabular-nums">{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{ORDER_TEXT.SUMMARY_MARGIN_REQ}</span>
						<span className="tabular-nums">
							{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{ORDER_TEXT.SUMMARY_SLIPPAGE}</span>
						<span className="tabular-nums text-terminal-amber">{(slippageBps / 100).toFixed(2)}%</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{ORDER_TEXT.SUMMARY_FEE}</span>
						<span className="tabular-nums text-muted-foreground">
							{estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
				</div>
			</div>

			{/* Modals */}
			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />

			{/* Order toast */}
			<OrderToast />
		</div>
	);
}
