import { t } from "@lingui/core/macro";
import { ChevronDown, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useChainId, useConnection, useSwitchChain, useWalletClient } from "wagmi";
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
} from "@/config/interface";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useSelectedResolvedMarket, useTradingAgent } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
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

export function OrderEntryPanel() {
	const reduceOnlyId = useId();
	const tpSlId = useId();
	const chainId = useChainId();

	const { address, isConnected } = useConnection();

	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const switchChain = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedResolvedMarket({ ctxMode: "realtime" });
	const { data: clearinghouseEvent } = useSubClearinghouseState(
		{ user: address ?? "0x0" },
		{ enabled: isConnected && !!address },
	);
	const clearinghouse = clearinghouseEvent?.clearinghouseState;

	const { status: agentStatus, registerStatus, registerAgent } = useTradingAgent();

	const { mutateAsync: placeOrder, isPending: isSubmitting } = useExchangeOrder();

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
	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [reduceOnly, setReduceOnly] = useState(false);

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);

	useEffect(() => {
		if (selectedPrice !== null) {
			setType("limit");
			setLimitPriceInput(String(selectedPrice));
			useOrderbookActionsStore.getState().clearSelectedPrice();
		}
	}, [selectedPrice]);

	const accountValue = parseNumber(clearinghouse?.crossMarginSummary?.accountValue) || 0;
	const marginUsed = parseNumber(clearinghouse?.crossMarginSummary?.totalMarginUsed) || 0;
	const availableBalance = Math.max(0, accountValue - marginUsed);

	const position =
		!clearinghouse?.assetPositions || !market?.coin
			? null
			: (clearinghouse.assetPositions.find((p) => p.position.coin === market.coin) ?? null);

	const positionSize = parseNumber(position?.position?.szi) || 0;

	const maxLeverage = market?.maxLeverage || DEFAULT_MAX_LEVERAGE;

	const leverage = (() => {
		if (!market?.marketKey) return getDefaultLeverage(maxLeverage);
		const marketSpecific = marketLeverageByMode[market.marketKey]?.cross;
		if (marketSpecific) return Math.min(marketSpecific, maxLeverage);
		const defaultLev = defaultLeverageByMode.cross ?? getDefaultLeverage(maxLeverage);
		return Math.min(defaultLev, maxLeverage);
	})();

	const ctxMarkPx = market?.ctxNumbers?.markPx;
	const markPx =
		typeof ctxMarkPx === "number" ? ctxMarkPx : typeof market?.midPxNumber === "number" ? market.midPxNumber : 0;

	const price = type === "market" ? markPx : parseNumber(limitPriceInput) || 0;

	const maxSize = (() => {
		if (!price || price <= 0 || !leverage) return 0;
		const maxNotional = availableBalance * leverage;
		let maxSizeRaw = maxNotional / price;

		if (side === "sell" && positionSize > 0) {
			maxSizeRaw += positionSize;
		} else if (side === "buy" && positionSize < 0) {
			maxSizeRaw += Math.abs(positionSize);
		}

		return floorToDecimals(maxSizeRaw, market?.szDecimals ?? 0);
	})();

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

	const needsAgentApproval = agentStatus !== "valid";
	const isReadyToTrade = agentStatus === "valid";
	const isLoadingAgents = agentStatus === "loading";
	const canApprove = !!walletClient && !!address;

	const validation = useMemo(() => {
		const errors: string[] = [];

		if (!isConnected) {
			return { valid: false, errors: [t`Not connected`], canSubmit: false, needsApproval: false };
		}
		if (isWalletLoading) {
			return { valid: false, errors: [t`Loading wallet...`], canSubmit: false, needsApproval: false };
		}
		if (availableBalance <= 0) {
			return { valid: false, errors: [t`No balance`], canSubmit: false, needsApproval: false };
		}
		if (!market) {
			return { valid: false, errors: [t`No market`], canSubmit: false, needsApproval: false };
		}
		if (typeof market.assetIndex !== "number") {
			return { valid: false, errors: [t`Market not ready`], canSubmit: false, needsApproval: false };
		}

		if (needsAgentApproval) {
			return { valid: false, errors: [], canSubmit: false, needsApproval: true };
		}

		if (!isReadyToTrade) {
			return { valid: false, errors: [t`Signer not ready`], canSubmit: false, needsApproval: false };
		}
		if (type === "market" && !markPx) {
			return { valid: false, errors: [t`No mark price`], canSubmit: false, needsApproval: false };
		}
		if (type === "limit" && !price) {
			errors.push(t`Enter limit price`);
		}
		if (!sizeValue || sizeValue <= 0) {
			errors.push(t`Enter size`);
		}
		if (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD) {
			errors.push(t`Min order $10`);
		}
		if (sizeValue > maxSize && maxSize > 0) {
			errors.push(t`Exceeds max size`);
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
		needsAgentApproval,
		isReadyToTrade,
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

	const handleLeverageChange = (newLeverage: number) => {
		if (market?.marketKey) {
			setMarketLeverage(market.marketKey, "cross", newLeverage, maxLeverage);
		}
	};

	const applySizeFromPercent = (pct: number) => {
		if (maxSize <= 0) return;
		const newSize = maxSize * (pct / 100);
		const formatted = formatDecimalFloor(newSize, market?.szDecimals ?? 0);
		if (sizeMode === "usd" && price > 0) {
			const usdValue = newSize * price;
			setSizeInput(usdValue > 0 ? usdValue.toFixed(2) : "");
			return;
		}
		setSizeInput(formatted || "");
	};

	const handleSliderChange = (values: number[]) => {
		applySizeFromPercent(values[0]);
	};

	const handlePercentClick = (pct: number) => {
		applySizeFromPercent(pct);
	};

	const handleSizeModeToggle = () => {
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
	};

	const handleMarkPriceClick = () => {
		if (markPx > 0) {
			const decimals = szDecimalsToPriceDecimals(market?.szDecimals ?? 4);
			setLimitPriceInput(markPx.toFixed(decimals));
		}
	};

	const handleSwitchChain = () => {
		switchChain.mutate({ chainId: ARBITRUM_CHAIN_ID });
	};

	const isRegistering = registerStatus === "signing" || registerStatus === "verifying";

	const handleRegister = async () => {
		if (isRegistering) return;
		setApprovalError(null);

		try {
			await registerAgent();
		} catch (error) {
			console.error("[OrderEntry] Registration failed:", error);
			const message = error instanceof Error ? error.message : t`Failed to enable trading`;
			setApprovalError(message);
		}
	};

	const handleSubmit = async () => {
		if (!validation.canSubmit || isSubmitting) return;
		if (typeof market?.assetIndex !== "number") return;

		let orderPrice = price;
		if (type === "market") {
			orderPrice = side === "buy" ? markPx * (1 + slippageBps / 10000) : markPx * (1 - slippageBps / 10000);
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
			const result = await placeOrder({
				orders: [
					{
						a: market.assetIndex,
						b: side === "buy",
						p: formattedPrice,
						s: formattedSize,
						r: reduceOnly,
						t: type === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif: "Gtc" as const } },
					},
				],
				grouping: "na",
			});

			const status = result.response?.data?.statuses?.[0];
			if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
				throw new Error(status.error);
			}

			updateOrder(orderId, { status: "success", fillPercent: 100 });

			setSizeInput("");
			setLimitPriceInput("");
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t`Order failed`;
			updateOrder(orderId, { status: "failed", error: errorMessage });
		}
	};

	const sliderValue = !maxSize || maxSize <= 0 ? 25 : Math.min(100, (sizeValue / maxSize) * 100);

	const buttonContent = (() => {
		if (!isConnected) {
			return {
				text: t`Connect Wallet`,
				action: () => setWalletDialogOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		}
		if (needsChainSwitch) {
			return {
				text: switchChain.isPending ? t`Switching...` : t`Switch to Arbitrum`,
				action: handleSwitchChain,
				disabled: switchChain.isPending,
				variant: "cyan" as const,
			};
		}
		if (availableBalance <= 0) {
			return {
				text: t`Deposit`,
				action: () => setDepositModalOpen(true),
				disabled: false,
				variant: "cyan" as const,
			};
		}
		if (validation.needsApproval) {
			const getRegisterText = () => {
				if (isLoadingAgents) return t`Loading...`;
				if (!canApprove) return t`Loading...`;
				switch (registerStatus) {
					case "signing":
						return t`Sign in wallet...`;
					case "verifying":
						return t`Verifying...`;
					default:
						return t`Enable Trading`;
				}
			};
			return {
				text: getRegisterText(),
				action: handleRegister,
				disabled: isRegistering || !canApprove || isLoadingAgents,
				variant: "cyan" as const,
			};
		}
		return {
			text: side === "buy" ? t`Buy` : t`Sell`,
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
						<TabsTrigger value="cross">{t`Cross`}</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="isolated" disabled className="opacity-50 cursor-not-allowed">
										{t`Isolated`}
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>{t`Coming soon`}</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>
				<div className="flex items-center gap-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="px-2 py-0.5 text-3xs border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1"
								tabIndex={0}
								aria-label={t`Select leverage`}
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
			</div>

			<div className="p-2 space-y-2 overflow-y-auto flex-1">
				<Tabs value={type} onValueChange={(v) => setType(v as OrderType)}>
					<TabsList>
						<TabsTrigger value="market" variant="underline">
							{t`Market`}
						</TabsTrigger>
						<TabsTrigger value="limit" variant="underline">
							{t`Limit`}
						</TabsTrigger>
						<Tooltip>
							<TooltipTrigger asChild>
								<span>
									<TabsTrigger value="stop" variant="underline" disabled className="opacity-50 cursor-not-allowed">
										{t`Stop`}
									</TabsTrigger>
								</span>
							</TooltipTrigger>
							<TooltipContent>{t`Coming soon`}</TooltipContent>
						</Tooltip>
					</TabsList>
				</Tabs>

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
						aria-label={t`Buy Long`}
					>
						<TrendingUp className="size-3 inline mr-1" />
						{t`Long`}
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
						aria-label={t`Sell Short`}
					>
						<TrendingDown className="size-3 inline mr-1" />
						{t`Short`}
					</button>
				</div>
				<div className="space-y-0.5 text-3xs">
					<div className="flex items-center justify-between text-muted-foreground">
						<span>{t`Available`}</span>
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
									{t`Deposit`}
								</button>
							)}
						</div>
					</div>
					{positionSize !== 0 && (
						<div className="flex items-center justify-between text-muted-foreground">
							<span>{t`Position`}</span>
							<span className={cn("tabular-nums", positionSize > 0 ? "text-terminal-green" : "text-terminal-red")}>
								{positionSize > 0 ? "+" : ""}
								{formatDecimalFloor(positionSize, market?.szDecimals ?? 2)} {market?.coin}
							</span>
						</div>
					)}
				</div>
				<div className="space-y-1.5">
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Size`}</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={handleSizeModeToggle}
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label={t`Toggle size mode`}
							disabled={isFormDisabled}
						>
							{sizeMode === "asset" ? market?.coin || "---" : "USD"} <ChevronDown className="size-2.5" />
						</button>
						<Input
							placeholder="0.00"
							value={sizeInput}
							onChange={(e) => setSizeInput(e.target.value)}
							className={cn(
								"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								(sizeHasError || orderValueTooLow) && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>

					<Slider
						value={[sliderValue]}
						onValueChange={handleSliderChange}
						max={100}
						step={0.1}
						className="py-5"
						disabled={isFormDisabled || maxSize <= 0}
					/>

					<div className="grid grid-cols-4 gap-1">
						{ORDER_SIZE_PERCENT_STEPS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => handlePercentClick(p)}
								className="py-1 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/40 hover:text-terminal-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								tabIndex={0}
								aria-label={t`Set ${p}%`}
								disabled={isFormDisabled || maxSize <= 0}
							>
								{p === 100 ? t`Max` : `${p}%`}
							</button>
						))}
					</div>
				</div>

				{type === "limit" && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Limit Price`}</div>
							{markPx > 0 && (
								<button
									type="button"
									onClick={handleMarkPriceClick}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan tabular-nums"
								>
									{t`Mark`}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</button>
							)}
						</div>
						<Input
							placeholder="0.00"
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

				<div className="flex items-center gap-3 text-3xs">
					<div className="inline-flex items-center gap-1.5">
						<Checkbox
							id={reduceOnlyId}
							className="size-3.5"
							aria-label={t`Reduce Only`}
							checked={reduceOnly}
							onCheckedChange={(checked) => setReduceOnly(checked === true)}
							disabled={isFormDisabled}
						/>
						<label
							htmlFor={reduceOnlyId}
							className={cn("cursor-pointer", isFormDisabled && "cursor-not-allowed text-muted-foreground")}
						>
							{t`Reduce Only`}
						</label>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="inline-flex items-center gap-1.5 cursor-not-allowed opacity-50">
								<Checkbox id={tpSlId} className="size-3.5" aria-label={t`Take Profit / Stop Loss`} disabled />
								<label htmlFor={tpSlId} className="text-muted-foreground cursor-not-allowed">
									{t`TP/SL`}
								</label>
							</div>
						</TooltipTrigger>
						<TooltipContent>{t`Coming soon`}</TooltipContent>
					</Tooltip>
				</div>

				<div className="h-4" />

				{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
					<div className="text-4xs text-terminal-red">{validation.errors.join(" • ")}</div>
				)}

				{approvalError && <div className="text-4xs text-terminal-red">{approvalError}</div>}

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
					{(isSubmitting || isRegistering) && <Loader2 className="size-3 animate-spin" />}
					{buttonContent.text}
				</button>

				<div className="border border-border/40 divide-y divide-border/40 text-3xs">
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{t`Liq. Price`}</span>
						<span className={cn("tabular-nums", liqWarning ? "text-terminal-red" : "text-terminal-red/70")}>
							{liqPrice ? formatPrice(liqPrice, { szDecimals: market?.szDecimals }) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{t`Order Value`}</span>
						<span className="tabular-nums">{orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{t`Margin Req.`}</span>
						<span className="tabular-nums">
							{marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{t`Slippage`}</span>
						<span className="tabular-nums text-terminal-amber">{(slippageBps / 100).toFixed(2)}%</span>
					</div>
					<div className="flex items-center justify-between px-2 py-1.5">
						<span className="text-muted-foreground">{t`Est. Fee`}</span>
						<span className="tabular-nums text-muted-foreground">
							{estimatedFee > 0 ? formatUSD(estimatedFee) : FALLBACK_VALUE_PLACEHOLDER}
						</span>
					</div>
				</div>
			</div>

			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />

			<OrderToast />
		</div>
	);
}
