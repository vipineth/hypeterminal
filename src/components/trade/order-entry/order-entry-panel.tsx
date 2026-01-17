import { t } from "@lingui/core/macro";
import { ArrowLeftRight, Loader2, PencilIcon, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	ARBITRUM_CHAIN_ID,
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
} from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useSelectedResolvedMarket, useTradingAgent } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { formatDecimalFloor, isPositive, parseNumber, toNumber } from "@/lib/trade/numbers";
import {
	getConversionPrice,
	getExecutedPrice,
	getLiquidationInfo,
	getMaxSize,
	getOrderMetrics,
	getOrderPrice,
	getSizeValues,
	getSliderValue,
} from "@/lib/trade/order-entry-calcs";
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import {
	useOrderEntryActions,
	useOrderSide,
	useOrderType,
	useReduceOnly,
	useSizeMode,
} from "@/stores/use-order-entry-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { GlobalSettingsDialog } from "../components/global-settings-dialog";
import { WalletDialog } from "../components/wallet-dialog";
import { DepositModal } from "./deposit-modal";
import { LeverageControl, useAssetLeverage } from "./leverage-control";
import { MarginModeDialog } from "./margin-mode-dialog";
import { MarginModeToggle } from "./margin-mode-toggle";
import { OrderToast } from "./order-toast";
import { TpSlSection } from "./tp-sl-section";

type ValidationResult = {
	valid: boolean;
	errors: string[];
	canSubmit: boolean;
	needsApproval: boolean;
};

type ButtonContent = {
	text: string;
	action: () => void;
	disabled: boolean;
	variant: "cyan" | "buy" | "sell";
};

export function OrderEntryPanel() {
	const reduceOnlyId = useId();
	const tpSlId = useId();

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

	const slippageBps = useMarketOrderSlippageBps();

	const {
		displayLeverage: leverage,
		availableToSell,
		availableToBuy,
		maxTradeSzs,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
	} = useAssetLeverage();

	const { addOrder, updateOrder } = useOrderQueueActions();

	const selectedPrice = useSelectedPrice();

	const side = useOrderSide();
	const orderType = useOrderType();
	const sizeMode = useSizeMode();
	const reduceOnly = useReduceOnly();

	const { setSide, setOrderType, setSizeMode, setReduceOnly } = useOrderEntryActions();

	const [sizeInput, setSizeInput] = useState("");
	const [hasUserSized, setHasUserSized] = useState(false);
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [isDraggingSlider, setIsDraggingSlider] = useState(false);
	const [dragSliderValue, setDragSliderValue] = useState(25);
	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
	const [tpSlEnabled, setTpSlEnabled] = useState(false);
	const [tpPriceInput, setTpPriceInput] = useState("");
	const [slPriceInput, setSlPriceInput] = useState("");
	const [marginModeDialogOpen, setMarginModeDialogOpen] = useState(false);

	useEffect(() => {
		if (selectedPrice !== null) {
			setOrderType("limit");
			setLimitPriceInput(String(selectedPrice));
			getOrderbookActionsStore().actions.clearSelectedPrice();
		}
	}, [selectedPrice, setOrderType]);

	const tpPriceNum = toNumber(tpPriceInput);
	const slPriceNum = toNumber(slPriceInput);

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
	const price = getOrderPrice(orderType, markPx, limitPriceInput);

	const maxSize = useMemo(
		() =>
			getMaxSize({
				isConnected,
				maxTradeSzs,
				szDecimals: market?.szDecimals,
				side,
				availableToBuy,
				availableToSell,
			}),
		[availableToBuy, availableToSell, isConnected, market?.szDecimals, maxTradeSzs, side],
	);

	const conversionPx = getConversionPrice(markPx, price);
	const { sizeValue } = useMemo(
		() => getSizeValues({ sizeInput, sizeMode, conversionPx }),
		[conversionPx, sizeInput, sizeMode],
	);

	const { orderValue, marginRequired, estimatedFee } = useMemo(
		() =>
			getOrderMetrics({
				sizeValue,
				price,
				leverage,
				orderType,
			}),
		[leverage, orderType, price, sizeValue],
	);

	const { liqPrice, liqWarning } = useMemo(
		() =>
			getLiquidationInfo({
				price,
				sizeValue,
				leverage,
				side,
			}),
		[leverage, price, side, sizeValue],
	);

	const needsAgentApproval = agentStatus !== "valid";
	const isReadyToTrade = agentStatus === "valid";
	const isLoadingAgents = agentStatus === "loading";
	const canApprove = !!walletClient && !!address;

	const validation = useMemo<ValidationResult>(() => {
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
		if (orderType === "market" && !markPx) {
			return { valid: false, errors: [t`No mark price`], canSubmit: false, needsApproval: false };
		}

		const errors: string[] = [];
		if (orderType === "limit" && !price) {
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

		if (tpSlEnabled) {
			const hasTp = isPositive(tpPriceNum);
			const hasSl = isPositive(slPriceNum);
			if (!hasTp && !hasSl) {
				errors.push(t`Enter TP or SL price`);
			}
			if (hasTp && !validateTpPrice(price, tpPriceNum, side)) {
				errors.push(side === "buy" ? t`TP must be above entry` : t`TP must be below entry`);
			}
			if (hasSl && !validateSlPrice(price, slPriceNum, side)) {
				errors.push(side === "buy" ? t`SL must be below entry` : t`SL must be above entry`);
			}
		}

		return { valid: errors.length === 0, errors, canSubmit: errors.length === 0, needsApproval: false };
	}, [
		isConnected,
		isWalletLoading,
		availableBalance,
		market,
		orderType,
		markPx,
		price,
		sizeValue,
		orderValue,
		maxSize,
		needsAgentApproval,
		isReadyToTrade,
		tpSlEnabled,
		tpPriceNum,
		slPriceNum,
		side,
	]);

	const sizeHasError = sizeValue > maxSize && maxSize > 0;
	const orderValueTooLow = orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD;

	function applySizePercent(pct: number) {
		if (maxSize <= 0) return;
		setHasUserSized(true);
		const newSize = maxSize * (pct / 100);
		if (sizeMode === "usd" && conversionPx > 0) {
			setSizeInput((newSize * conversionPx).toFixed(2));
			return;
		}
		setSizeInput(formatDecimalFloor(newSize, market?.szDecimals ?? 0) || "");
	}

	function handleSizeModeToggle() {
		const newMode = sizeMode === "asset" ? "usd" : "asset";
		if (conversionPx > 0 && sizeValue > 0) {
			setHasUserSized(true);
			setSizeInput(
				newMode === "usd"
					? (sizeValue * conversionPx).toFixed(2)
					: formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "",
			);
		}
		setSizeMode(newMode);
	}

	const isRegistering = registerStatus === "signing" || registerStatus === "verifying";

	const handleMarginModeConfirm = useCallback(
		async (mode: MarginMode) => {
			try {
				await switchMarginMode(mode);
			} catch (error) {
				const message = error instanceof Error ? error.message : t`Failed to switch margin mode`;
				toast.error(message);
				throw error;
			}
		},
		[switchMarginMode],
	);

	const handleRegister = useCallback(
		function handleRegister() {
			if (isRegistering) return;
			setApprovalError(null);
			registerAgent().catch((error) => {
				const message = error instanceof Error ? error.message : t`Failed to enable trading`;
				setApprovalError(message);
			});
		},
		[isRegistering, registerAgent],
	);

	const handleSubmit = useCallback(
		async function handleSubmit() {
			if (!validation.canSubmit || isSubmitting) return;
			if (typeof market?.assetIndex !== "number") return;

			const orderPrice = getExecutedPrice(orderType, side, markPx, slippageBps, price);

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
				const orders: Array<{
					a: number;
					b: boolean;
					p: string;
					s: string;
					r: boolean;
					t:
						| { limit: { tif: "FrontendMarket" | "Gtc" } }
						| { trigger: { isMarket: boolean; triggerPx: string; tpsl: "tp" | "sl" } };
				}> = [
					{
						a: market.assetIndex,
						b: side === "buy",
						p: formattedPrice,
						s: formattedSize,
						r: reduceOnly,
						t:
							orderType === "market"
								? { limit: { tif: "FrontendMarket" as const } }
								: { limit: { tif: "Gtc" as const } },
					},
				];

				const hasTp = tpSlEnabled && isPositive(tpPriceNum);
				const hasSl = tpSlEnabled && isPositive(slPriceNum);

				if (hasTp) {
					orders.push({
						a: market.assetIndex,
						b: side !== "buy",
						p: formatPriceForOrder(tpPriceNum),
						s: formattedSize,
						r: true,
						t: {
							trigger: {
								isMarket: true,
								triggerPx: formatPriceForOrder(tpPriceNum),
								tpsl: "tp",
							},
						},
					});
				}

				if (hasSl) {
					orders.push({
						a: market.assetIndex,
						b: side !== "buy",
						p: formatPriceForOrder(slPriceNum),
						s: formattedSize,
						r: true,
						t: {
							trigger: {
								isMarket: true,
								triggerPx: formatPriceForOrder(slPriceNum),
								tpsl: "sl",
							},
						},
					});
				}

				const grouping = hasTp || hasSl ? "positionTpsl" : "na";

				const result = await placeOrder({ orders, grouping });

				const status = result.response?.data?.statuses?.[0];
				if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
					throw new Error(status.error);
				}

				updateOrder(orderId, { status: "success", fillPercent: 100 });

				setSizeInput("");
				setHasUserSized(false);
				setLimitPriceInput("");
				setTpPriceInput("");
				setSlPriceInput("");
				setTpSlEnabled(false);
				return;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : t`Order failed`;
				updateOrder(orderId, { status: "failed", error: errorMessage });
			}
		},
		[
			addOrder,
			isSubmitting,
			market?.assetIndex,
			market?.coin,
			market?.szDecimals,
			markPx,
			orderType,
			placeOrder,
			price,
			reduceOnly,
			side,
			sizeValue,
			slippageBps,
			slPriceNum,
			tpPriceNum,
			tpSlEnabled,
			updateOrder,
			validation.canSubmit,
		],
	);

	const sliderValue = useMemo(() => {
		if (isDraggingSlider) return dragSliderValue;
		if (!hasUserSized || sizeValue <= 0) return 25;
		return getSliderValue(sizeValue, maxSize);
	}, [isDraggingSlider, dragSliderValue, hasUserSized, sizeValue, maxSize]);

	const registerText = useMemo(() => {
		if (isLoadingAgents) return t`Loading...`;
		if (!canApprove) return t`Loading...`;
		if (registerStatus === "signing") return t`Sign in wallet...`;
		if (registerStatus === "verifying") return t`Verifying...`;
		return t`Enable Trading`;
	}, [canApprove, isLoadingAgents, registerStatus]);

	const buttonContent = useMemo<ButtonContent>(() => {
		if (!isConnected) {
			return {
				text: t`Connect Wallet`,
				action: () => setWalletDialogOpen(true),
				disabled: false,
				variant: "cyan",
			};
		}
		if (needsChainSwitch) {
			return {
				text: switchChain.isPending ? t`Switching...` : t`Switch to Arbitrum`,
				action: () => switchChain.mutate({ chainId: ARBITRUM_CHAIN_ID }),
				disabled: switchChain.isPending,
				variant: "cyan",
			};
		}
		if (availableBalance <= 0) {
			return {
				text: t`Deposit`,
				action: () => setDepositModalOpen(true),
				disabled: false,
				variant: "cyan",
			};
		}
		if (validation.needsApproval) {
			return {
				text: registerText,
				action: handleRegister,
				disabled: isRegistering || !canApprove || isLoadingAgents,
				variant: "cyan",
			};
		}
		return {
			text: side === "buy" ? t`Buy` : t`Sell`,
			action: handleSubmit,
			disabled: !validation.canSubmit || isSubmitting,
			variant: side as "buy" | "sell",
		};
	}, [
		isConnected,
		needsChainSwitch,
		switchChain,
		availableBalance,
		validation.needsApproval,
		registerText,
		isRegistering,
		canApprove,
		isLoadingAgents,
		handleRegister,
		handleSubmit,
		side,
		validation.canSubmit,
		isSubmitting,
	]);

	const isFormDisabled = !isConnected || availableBalance <= 0;

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
				<MarginModeToggle mode={marginMode} disabled={isSwitchingMode} onClick={() => setMarginModeDialogOpen(true)} />
				<LeverageControl key={market?.marketKey} />
			</div>

			<MarginModeDialog
				open={marginModeDialogOpen}
				onOpenChange={setMarginModeDialogOpen}
				currentMode={marginMode}
				hasPosition={hasPosition}
				isUpdating={isSwitchingMode}
				updateError={switchModeError}
				onConfirm={handleMarginModeConfirm}
				needsTradingEnabled={agentStatus !== "valid"}
				isEnablingTrading={isRegistering}
				onEnableTrading={handleRegister}
			/>

			<div className="p-2 space-y-4 overflow-y-auto flex-1">
				<div className="space-y-2">
					<Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
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
						<Button
							variant="ghost"
							size="none"
							onClick={() => setSide("buy")}
							className={cn(
								"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
								side === "buy"
									? "bg-terminal-green/20 border-terminal-green text-terminal-green terminal-glow-green"
									: "border-border/60 text-muted-foreground hover:border-terminal-green/40 hover:text-terminal-green",
							)}
							aria-label={t`Buy Long`}
						>
							<TrendingUp className="size-3 inline mr-1" />
							{t`Long`}
						</Button>
						<Button
							variant="ghost"
							size="none"
							onClick={() => setSide("sell")}
							className={cn(
								"py-2 text-2xs font-semibold uppercase tracking-wider border hover:bg-transparent",
								side === "sell"
									? "bg-terminal-red/20 border-terminal-red text-terminal-red terminal-glow-red"
									: "border-border/60 text-muted-foreground hover:border-terminal-red/40 hover:text-terminal-red",
							)}
							aria-label={t`Sell Short`}
						>
							<TrendingDown className="size-3 inline mr-1" />
							{t`Short`}
						</Button>
					</div>
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
								<Button
									variant="link"
									size="none"
									onClick={() => setDepositModalOpen(true)}
									className="text-terminal-cyan text-4xs uppercase"
								>
									{t`Deposit`}
								</Button>
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
						<Button
							variant="ghost"
							size="none"
							onClick={handleSizeModeToggle}
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 hover:bg-transparent gap-1"
							aria-label={t`Toggle size mode`}
							disabled={isFormDisabled}
						>
							{sizeMode === "asset" ? market?.coin || "---" : "USD"} <ArrowLeftRight className="size-2.5" />
						</Button>
						<NumberInput
							placeholder="0.00"
							value={sizeInput}
							onChange={(e) => {
								setHasUserSized(true);
								setSizeInput(e.target.value);
							}}
							className={cn(
								"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								(sizeHasError || orderValueTooLow) && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>

					<Slider
						value={[sliderValue]}
						onValueChange={(v) => {
							setIsDraggingSlider(true);
							setDragSliderValue(v[0]);
						}}
						onValueCommit={(v) => {
							setIsDraggingSlider(false);
							applySizePercent(v[0]);
						}}
						max={100}
						step={0.1}
						className="py-5"
						disabled={isFormDisabled || maxSize <= 0}
					/>

					<div className="grid grid-cols-4 gap-1">
						{ORDER_SIZE_PERCENT_STEPS.map((p) => (
							<Button key={p} onClick={() => applySizePercent(p)} variant="outline" size="xs" aria-label={t`Set ${p}%`}>
								{p === 100 ? t`Max` : `${p}%`}
							</Button>
						))}
					</div>
				</div>

				{orderType === "limit" && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Limit Price`}</div>
							{markPx > 0 && (
								<Button
									variant="ghost"
									size="none"
									onClick={() => setLimitPriceInput(markPx.toFixed(szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan hover:bg-transparent tabular-nums"
								>
									{t`Mark`}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</Button>
							)}
						</div>
						<NumberInput
							placeholder="0.00"
							value={limitPriceInput}
							onChange={(e) => setLimitPriceInput(e.target.value)}
							className={cn(
								"h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								orderType === "limit" && !price && sizeValue > 0 && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				<div className="space-y-4">
					<div className="flex items-center gap-3 text-3xs">
						<div className="inline-flex items-center gap-2">
							<Checkbox
								id={reduceOnlyId}
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
						<div className="inline-flex items-center gap-2">
							<Checkbox
								id={tpSlId}
								aria-label={t`Take Profit / Stop Loss`}
								checked={tpSlEnabled}
								onCheckedChange={(checked) => setTpSlEnabled(checked === true)}
								disabled={isFormDisabled}
							/>
							<label
								htmlFor={tpSlId}
								className={cn("cursor-pointer", isFormDisabled && "cursor-not-allowed text-muted-foreground")}
							>
								{t`TP/SL`}
							</label>
						</div>
					</div>

					{tpSlEnabled && (
						<TpSlSection
							side={side}
							referencePrice={price}
							size={sizeValue}
							szDecimals={market?.szDecimals}
							tpPrice={tpPriceInput}
							slPrice={slPriceInput}
							onTpPriceChange={setTpPriceInput}
							onSlPriceChange={setSlPriceInput}
							disabled={isFormDisabled}
						/>
					)}
				</div>

				<div className="space-y-2">
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
						<div className="text-4xs text-terminal-red">{validation.errors.join(" • ")}</div>
					)}

					{approvalError && <div className="text-4xs text-terminal-red">{approvalError}</div>}

					<Button
						variant="ghost"
						size="none"
						onClick={buttonContent.action}
						disabled={buttonContent.disabled}
						className={cn(
							"w-full py-2.5 text-2xs font-semibold uppercase tracking-wider border gap-2 hover:bg-transparent",
							buttonContent.variant === "cyan"
								? "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30"
								: buttonContent.variant === "buy"
									? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
									: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
						)}
						aria-label={buttonContent.text}
					>
						{(isSubmitting || isRegistering) && <Loader2 className="size-3 animate-spin" />}
						{buttonContent.text}
					</Button>
				</div>

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
						<button
							type="button"
							onClick={() => setSettingsDialogOpen(true)}
							className="flex items-center gap-1 hover:text-foreground transition-colors"
						>
							<span className="tabular-nums text-terminal-amber">{(slippageBps / 100).toFixed(2)}%</span>
							<PencilIcon className="size-2 text-muted-foreground" />
						</button>
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
			<GlobalSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />

			<OrderToast />
		</div>
	);
}
