import { t } from "@lingui/core/macro";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	DEFAULT_QUOTE_TOKEN,
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
	SCALE_LEVELS_MAX,
	SCALE_LEVELS_MIN,
	TWAP_MINUTES_MAX,
	TWAP_MINUTES_MIN,
} from "@/config/constants";
import { getMarketQuoteToken } from "@/domain/trade/balances";
import { getLiquidationInfo, getOrderMetrics } from "@/domain/trade/order/metrics";
import { getOrderPrice } from "@/domain/trade/order/price";
import { getSliderValue } from "@/domain/trade/order/size";
import { buildOrders, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { cn } from "@/lib/cn";
import { formatPrice, formatToken, szDecimalsToPriceDecimals } from "@/lib/format";
import {
	useAgentRegistration,
	useAgentStatus,
	useSelectedMarketInfo,
	useSpotTokens,
	useUserPositions,
} from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useExchangeTwapOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeTwapOrder";
import type { MarginMode } from "@/lib/trade/margin-mode";
import {
	clampInt,
	formatDecimalFloor,
	getValueColorClass,
	isPositive,
	toFixed,
	toNumber,
	toNumberOrZero,
} from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	getTabsOrderType,
	isScaleOrderType,
	isStopOrderType,
	isTakeProfitOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	type LimitTif,
	TIF_OPTIONS,
	usesLimitPrice as usesLimitPriceForOrder,
	usesTriggerPrice as usesTriggerPriceForOrder,
} from "@/lib/trade/order-types";
import type { ActiveDialog, ButtonContent } from "@/lib/trade/types";
import { useButtonContent } from "@/lib/trade/use-button-content";
import { perpInput, spotInput, useOrderValidation } from "@/lib/trade/use-order-validation";
import { useDepositModalActions, useSettingsDialogActions, useSwapModalActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps } from "@/stores/use-global-settings-store";
import {
	useLimitPrice,
	useOrderEntryActions,
	useOrderSide,
	useOrderSize,
	useOrderType,
	useReduceOnly,
	useScaleEnd,
	useScaleLevels,
	useScaleStart,
	useSizeMode,
	useSlPrice,
	useTif,
	useTpPrice,
	useTpSlEnabled,
	useTriggerPrice,
	useTwapMinutes,
	useTwapRandomize,
} from "@/stores/use-order-entry-store";
import { useOrderQueueActions } from "@/stores/use-order-queue-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { WalletDialog } from "../components/wallet-dialog";
import { AdvancedOrderDropdown } from "./advanced-order-dropdown";
import { LeverageControl } from "./leverage-control";
import { MarginModeDialog } from "./margin-mode-dialog";
import { MarginModeToggle } from "./margin-mode-toggle";
import { OrderSummary } from "./order-summary";
import { OrderToast } from "./order-toast";
import { SideToggle } from "./side-toggle";
import { TpSlSection } from "./tp-sl-section";

function getActionButtonClass(variant: ButtonContent["variant"]): string {
	if (variant === "cyan") {
		return "bg-info/20 border-info text-info hover:bg-info/30";
	}
	if (variant === "buy") {
		return "bg-positive/20 border-positive text-positive hover:bg-positive/30";
	}
	return "bg-negative/20 border-negative text-negative hover:bg-negative/30";
}

export function OrderEntryPanel() {
	const reduceOnlyId = useId();
	const tpSlId = useId();

	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const switchChain = useSwitchChain();
	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedMarketInfo();

	const userPositions = useUserPositions();

	const { isReady: isAgentReady, isLoading: isAgentLoading } = useAgentStatus();
	const { register: registerAgent, status: registerStatus } = useAgentRegistration();
	const { mutateAsync: placeOrder, isPending: isSubmittingOrder } = useExchangeOrder();
	const { mutateAsync: placeTwapOrder, isPending: isSubmittingTwap } = useExchangeTwapOrder();

	const slippageBps = useMarketOrderSlippageBps();
	const side = useOrderSide();
	const markPx = market?.markPx ?? 0;
	const sizeMode = useSizeMode();
	const sizeInput = useOrderSize();

	const {
		isSpotMarket,
		baseToken,
		quoteToken,
		spotBalance,
		capabilities,
		availableBalance,
		availableBalanceToken,
		maxSize,
		sizeValue,
		orderValue,
		sideLabels,
		sizeModeLabel,
		getSizeForPercent,
		convertSizeForModeToggle,
		leverage,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
		szDecimals,
	} = useOrderEntryData({ market, side, markPx, sizeMode, sizeInput });

	const { getToken } = useSpotTokens();
	const sizeModeToken = getToken(sizeModeLabel);

	const { addOrder, updateOrder } = useOrderQueueActions();
	const selectedPrice = useSelectedPrice();
	const orderType = useOrderType();
	const reduceOnly = useReduceOnly();
	const limitPriceInput = useLimitPrice();
	const triggerPriceInput = useTriggerPrice();
	const scaleStartPriceInput = useScaleStart();
	const scaleEndPriceInput = useScaleEnd();
	const scaleLevelsNum = useScaleLevels();
	const twapMinutesNum = useTwapMinutes();
	const twapRandomize = useTwapRandomize();
	const tpSlEnabled = useTpSlEnabled();
	const tpPriceInput = useTpPrice();
	const slPriceInput = useSlPrice();
	const tif = useTif();

	const stopOrder = isStopOrderType(orderType);
	const takeProfitOrder = isTakeProfitOrderType(orderType);
	const triggerOrder = isTriggerOrderType(orderType);
	const twapOrder = isTwapOrderType(orderType);
	const scaleOrder = isScaleOrderType(orderType);
	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const usesTriggerPrice = usesTriggerPriceForOrder(orderType);
	const tabsOrderType = getTabsOrderType(orderType);
	const canUseTpSl = canUseTpSlForOrder(orderType);
	const showTif = orderType === "limit" || orderType === "scale";
	const availableTifOptions = orderType === "limit" ? (["Gtc", "Ioc", "Alo"] as const) : (["Gtc", "Alo"] as const);

	const {
		setSide,
		setOrderType,
		setSizeMode,
		setReduceOnly,
		setSize,
		setLimitPrice,
		setTriggerPrice,
		setScaleStart,
		setScaleEnd,
		setScaleLevels,
		setTwapMinutes,
		setTwapRandomize,
		setTpSlEnabled,
		setTpPrice,
		setSlPrice,
		setTif,
		resetForm,
	} = useOrderEntryActions();

	const [hasUserSized, setHasUserSized] = useState(false);
	const [isDraggingSlider, setIsDraggingSlider] = useState(false);
	const [dragSliderValue, setDragSliderValue] = useState(25);
	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { open: openSwapModal } = useSwapModalActions();

	const swapTargetToken = useMemo(() => {
		if (!market || market.kind !== "builderPerp") return null;

		const quoteToken = getMarketQuoteToken(market);
		if (quoteToken === DEFAULT_QUOTE_TOKEN) return null;

		return quoteToken;
	}, [market]);

	useEffect(() => {
		if (selectedPrice !== null) {
			setOrderType("limit");
			setLimitPrice(String(selectedPrice));
			getOrderbookActionsStore().actions.clearSelectedPrice();
		}
	}, [selectedPrice, setOrderType, setLimitPrice]);

	const tpPriceNum = toNumber(tpPriceInput);
	const slPriceNum = toNumber(slPriceInput);
	const triggerPriceNum = toNumber(triggerPriceInput);
	const scaleStartPriceNum = toNumber(scaleStartPriceInput);
	const scaleEndPriceNum = toNumber(scaleEndPriceInput);

	const isSubmitting = isSubmittingOrder || isSubmittingTwap;

	const position = market?.name ? userPositions.getPosition(market.name) : null;
	const positionSize = toNumberOrZero(position?.szi);

	const price = getOrderPrice(
		orderType,
		markPx,
		limitPriceInput,
		triggerPriceInput,
		scaleStartPriceInput,
		scaleEndPriceInput,
	);

	const { marginRequired, estimatedFee } = useMemo(
		() => getOrderMetrics({ sizeValue, price, leverage, orderType }),
		[leverage, orderType, price, sizeValue],
	);

	const { liqPrice, liqWarning } = useMemo(
		() => getLiquidationInfo({ price, sizeValue, leverage, side }),
		[leverage, price, side, sizeValue],
	);

	const needsAgentApproval = !isAgentReady;
	const isReadyToTrade = isAgentReady;
	const canApprove = !!walletClient && !!address;

	const baseInput = {
		isConnected,
		isWalletLoading,
		availableBalance,
		hasMarket: !!market,
		hasAssetIndex: typeof market?.assetId === "number",
		needsAgentApproval,
		isReadyToTrade,
		price,
		sizeValue,
		orderValue,
		side,
		usesLimitPrice,
	};

	const validation = useOrderValidation(
		isSpotMarket
			? spotInput(baseInput, {
					baseAvailable: spotBalance.baseAvailable,
					quoteAvailable: spotBalance.quoteAvailable,
					baseToken,
					quoteToken,
				})
			: perpInput(baseInput, {
					orderType,
					markPx,
					maxSize,
					usesTriggerPrice,
					triggerPriceNum,
					stopOrder,
					takeProfitOrder,
					scaleOrder,
					twapOrder,
					scaleStartPriceNum,
					scaleEndPriceNum,
					scaleLevelsNum,
					twapMinutesNum,
					tpSlEnabled,
					canUseTpSl,
					tpPriceNum,
					slPriceNum,
				}),
	);

	const sizeHasError = (sizeValue > maxSize && maxSize > 0) || (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD);

	function applySizePercent(pct: number) {
		if (maxSize <= 0) return;
		setHasUserSized(true);
		const newSize = getSizeForPercent(pct);
		if (newSize) setSize(newSize);
	}

	function handleSizeModeToggle() {
		const newMode = sizeMode === "base" ? "quote" : "base";
		const convertedSize = convertSizeForModeToggle();
		if (convertedSize) {
			setHasUserSized(true);
			setSize(convertedSize);
		}
		setSizeMode(newMode);
	}

	const isRegistering =
		registerStatus === "approving_fee" || registerStatus === "approving_agent" || registerStatus === "verifying";

	const handleMarginModeConfirm = useCallback(
		async (mode: MarginMode) => {
			await switchMarginMode(mode);
		},
		[switchMarginMode],
	);

	const handleRegister = useCallback(() => {
		if (isRegistering) return;
		setApprovalError(null);

		registerAgent().catch((error: unknown) => {
			const message = error instanceof Error ? error.message : t`Failed to enable trading`;
			setApprovalError(message);
		});
	}, [isRegistering, registerAgent]);

	const handleSubmit = useCallback(async () => {
		if (!validation.canSubmit || isSubmitting) return;
		if (!market || !baseToken || typeof market.assetId !== "number") return;

		const szDecimals = market.szDecimals ?? 0;
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		const orderId = addOrder({
			market: baseToken,
			side,
			size: formattedSize,
			status: "pending",
		});

		try {
			if (twapOrder) {
				const minutes = clampInt(Math.round(twapMinutesNum ?? 0), TWAP_MINUTES_MIN, TWAP_MINUTES_MAX);
				const result = await placeTwapOrder({
					twap: {
						a: market.assetId,
						b: side === "buy",
						s: formattedSize,
						r: reduceOnly,
						m: minutes,
						t: twapRandomize,
					},
				});
				throwIfResponseError(result.response?.data?.status);
				updateOrder(orderId, { status: "success", fillPercent: 100 });
			} else {
				const { orders, grouping } = buildOrders({
					assetId: market.assetId,
					side,
					orderType,
					sizeValue,
					szDecimals,
					markPx,
					price,
					slippageBps,
					reduceOnly,
					tif,
					limitPriceInput,
					triggerPriceInput,
					scaleStartPriceInput,
					scaleEndPriceInput,
					scaleLevelsNum,
					tpSlEnabled,
					canUseTpSl,
					tpPriceNum,
					slPriceNum,
					isStopOrder: stopOrder,
					isTriggerOrder: triggerOrder,
					isScaleOrder: scaleOrder,
					usesLimitPriceForOrder: usesLimitPrice,
				});

				const result = await placeOrder({ orders, grouping });
				throwIfResponseError(result.response?.data?.statuses?.[0]);
				updateOrder(orderId, { status: "success", fillPercent: 100 });
			}

			resetForm();
			setHasUserSized(false);
			return;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : t`Order failed`;
			updateOrder(orderId, { status: "failed", error: errorMessage });
		}
	}, [
		addOrder,
		baseToken,
		canUseTpSl,
		isSubmitting,
		limitPriceInput,
		market,
		markPx,
		orderType,
		placeOrder,
		placeTwapOrder,
		price,
		reduceOnly,
		resetForm,
		scaleEndPriceInput,
		scaleLevelsNum,
		scaleOrder,
		scaleStartPriceInput,
		side,
		sizeValue,
		slippageBps,
		slPriceNum,
		stopOrder,
		tif,
		tpPriceNum,
		tpSlEnabled,
		triggerOrder,
		triggerPriceInput,
		twapMinutesNum,
		twapOrder,
		twapRandomize,
		updateOrder,
		usesLimitPrice,
		validation.canSubmit,
	]);

	const sliderValue = useMemo(() => {
		if (isDraggingSlider) return dragSliderValue;
		if (!hasUserSized || sizeValue <= 0) return 25;
		return getSliderValue(sizeValue, maxSize);
	}, [isDraggingSlider, dragSliderValue, hasUserSized, sizeValue, maxSize]);

	const buttonContent = useButtonContent({
		isConnected,
		needsChainSwitch,
		isSwitchingChain: switchChain.isPending,
		switchChain: (chainId) => switchChain.mutate({ chainId }),
		availableBalance,
		validation,
		isAgentLoading,
		registerStatus,
		canApprove,
		side,
		isSubmitting,
		onConnectWallet: () => setActiveDialog("wallet"),
		onDeposit: () => openDepositModal("deposit"),
		onRegister: handleRegister,
		onSubmit: handleSubmit,
	});

	const isFormDisabled = !isConnected || availableBalance <= 0;
	const actionButtonClass = getActionButtonClass(buttonContent.variant);

	function formatAvailableBalance(): string {
		if (!isConnected) return FALLBACK_VALUE_PLACEHOLDER;
		const isBaseToken = isSpotMarket && side === "sell";
		const decimals = isBaseToken ? szDecimals : 2;
		return formatToken(availableBalance, decimals);
	}

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			{capabilities.isLeveraged && (
				<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
					{capabilities.hasMarginMode ? (
						<MarginModeToggle
							mode={marginMode}
							disabled={isSwitchingMode}
							onClick={() => setActiveDialog("marginMode")}
						/>
					) : (
						<MarginModeToggle mode="isolated" disabled onClick={() => {}} />
					)}
					<LeverageControl key={market?.name} />
				</div>
			)}

			<MarginModeDialog
				open={activeDialog === "marginMode"}
				onOpenChange={(open) => setActiveDialog(open ? "marginMode" : null)}
				currentMode={marginMode}
				hasPosition={hasPosition}
				isUpdating={isSwitchingMode}
				updateError={switchModeError}
				onConfirm={handleMarginModeConfirm}
			/>

			<div className="p-2 space-y-4 overflow-y-auto flex-1">
				<div className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<Tabs value={tabsOrderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
							<TabsList>
								<TabsTrigger value="market" variant="underline">
									{t`Market`}
								</TabsTrigger>
								<TabsTrigger value="limit" variant="underline">
									{t`Limit`}
								</TabsTrigger>
							</TabsList>
						</Tabs>
						<AdvancedOrderDropdown orderType={orderType} onOrderTypeChange={setOrderType} marketKind={market?.kind} />
					</div>

					<SideToggle side={side} onSideChange={setSide} labels={sideLabels} />
				</div>

				<div className="space-y-0.5 text-3xs">
					<div className="flex items-center justify-between text-muted-fg">
						<span>{t`Available`}</span>
						<div className="flex items-center gap-2">
							<span className={cn("tabular-nums flex items-center gap-1", getValueColorClass(availableBalance))}>
								{formatAvailableBalance()} {availableBalanceToken}
							</span>
							{isConnected && swapTargetToken && (
								<Button
									variant="link"
									size="none"
									onClick={() => openSwapModal(DEFAULT_QUOTE_TOKEN, swapTargetToken)}
									className="text-info text-4xs uppercase"
								>
									{t`Swap`}
								</Button>
							)}
							{isConnected && (
								<Button
									variant="link"
									size="none"
									onClick={() => openDepositModal("deposit")}
									className="text-info text-4xs uppercase"
								>
									{t`Deposit`}
								</Button>
							)}
						</div>
					</div>
					{!isSpotMarket && positionSize !== 0 && (
						<div className="flex items-center justify-between text-muted-fg">
							<span>{t`Position`}</span>
							<span className={cn("tabular-nums", getValueColorClass(positionSize))}>
								{positionSize > 0 ? "+" : ""}
								{formatDecimalFloor(positionSize, szDecimals)} {baseToken}
							</span>
						</div>
					)}
				</div>

				<div className="space-y-1.5">
					<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Size`}</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="none"
							onClick={handleSizeModeToggle}
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-fg/30 hover:bg-transparent gap-1"
							aria-label={t`Toggle size mode`}
							disabled={isFormDisabled}
						>
							<span className="text-4xs">{sizeModeLabel}</span>
							<ArrowLeftRight className="size-2.5" />
						</Button>
						<NumberInput
							placeholder="0.00"
							value={sizeInput}
							onChange={(e) => {
								setHasUserSized(true);
								setSize(e.target.value);
							}}
							className={cn(
								"flex-1 h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums",
								sizeHasError && "border-negative focus:border-negative",
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

				{usesTriggerPrice && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Trigger Price (USDC)`}</div>
							{markPx > 0 && (
								<Button
									variant="ghost"
									size="none"
									onClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
									className="text-4xs text-muted-fg hover:text-info hover:bg-transparent tabular-nums"
								>
									{t`Mark`}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</Button>
							)}
						</div>
						<NumberInput
							placeholder="0.00"
							value={triggerPriceInput}
							onChange={(e) => setTriggerPrice(e.target.value)}
							className={cn(
								"w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums",
								usesTriggerPrice &&
									!isPositive(triggerPriceNum) &&
									sizeValue > 0 &&
									"border-negative focus:border-negative",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{usesLimitPrice && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Limit Price`}</div>
							{markPx > 0 && (
								<Button
									variant="ghost"
									size="none"
									onClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
									className="text-4xs text-muted-fg hover:text-info hover:bg-transparent tabular-nums"
								>
									{t`Mark`}: {formatPrice(markPx, { szDecimals: market?.szDecimals })}
								</Button>
							)}
						</div>
						<NumberInput
							placeholder="0.00"
							value={limitPriceInput}
							onChange={(e) => setLimitPrice(e.target.value)}
							className={cn(
								"w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums",
								usesLimitPrice && !price && sizeValue > 0 && "border-negative focus:border-negative",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{showTif && (
					<div className="space-y-1.5">
						<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Time in Force`}</div>
						<Select value={tif} onValueChange={(value) => setTif(value as LimitTif)} disabled={isFormDisabled}>
							<SelectTrigger className="w-full h-8 text-sm bg-bg/50 border-border/60">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availableTifOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{TIF_OPTIONS[option].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{scaleOrder && (
					<>
						<div className="space-y-1.5">
							<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Start Price (USDC)`}</div>
							<NumberInput
								placeholder="0.00"
								value={scaleStartPriceInput}
								onChange={(e) => setScaleStart(e.target.value)}
								className="w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`End Price (USDC)`}</div>
							<NumberInput
								placeholder="0.00"
								value={scaleEndPriceInput}
								onChange={(e) => setScaleEnd(e.target.value)}
								className="w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Number of Orders`}</div>
								<span className="text-4xs text-muted-fg">{`${SCALE_LEVELS_MIN}-${SCALE_LEVELS_MAX}`}</span>
							</div>
							<NumberInput
								placeholder="4"
								value={String(scaleLevelsNum)}
								onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
								allowDecimals={false}
								className="w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
					</>
				)}

				{twapOrder && (
					<>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="text-4xs uppercase tracking-wider text-muted-fg">{t`Duration (Minutes)`}</div>
								<span className="text-4xs text-muted-fg">{`${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`}</span>
							</div>
							<NumberInput
								placeholder="30"
								value={String(twapMinutesNum)}
								onChange={(e) => setTwapMinutes(Number(e.target.value) || 30)}
								allowDecimals={false}
								className="w-full h-8 text-sm bg-bg/50 border-border/60 focus:border-info/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="flex items-center gap-2 text-3xs">
							<Checkbox
								checked={twapRandomize}
								onCheckedChange={(checked) => setTwapRandomize(checked === true)}
								disabled={isFormDisabled}
							/>
							<span className={cn(isFormDisabled && "text-muted-fg")}>{t`Randomize timing`}</span>
						</div>
					</>
				)}

				{(capabilities.hasReduceOnly || (capabilities.hasTpSl && canUseTpSl)) && (
					<div className="space-y-4">
						<div className="flex items-center gap-3 text-3xs">
							{capabilities.hasReduceOnly && (
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
										className={cn("cursor-pointer", isFormDisabled && "cursor-not-allowed text-muted-fg")}
									>
										{t`Reduce Only`}
									</label>
								</div>
							)}
							{capabilities.hasTpSl && canUseTpSl && (
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
										className={cn("cursor-pointer", isFormDisabled && "cursor-not-allowed text-muted-fg")}
									>
										{t`TP/SL`}
									</label>
								</div>
							)}
						</div>

						{capabilities.hasTpSl && tpSlEnabled && canUseTpSl && (
							<TpSlSection
								side={side}
								referencePrice={price}
								size={sizeValue}
								szDecimals={market?.szDecimals}
								tpPrice={tpPriceInput}
								slPrice={slPriceInput}
								onTpPriceChange={setTpPrice}
								onSlPriceChange={setSlPrice}
								disabled={isFormDisabled}
							/>
						)}
					</div>
				)}

				<div className="space-y-2">
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && (
						<div className="text-4xs text-negative">{validation.errors.join(" • ")}</div>
					)}

					{approvalError && <div className="text-4xs text-negative">{approvalError}</div>}

					<Button
						variant="ghost"
						size="none"
						onClick={buttonContent.action}
						disabled={buttonContent.disabled}
						className={cn(
							"w-full py-2.5 text-2xs font-semibold uppercase tracking-wider border gap-2 hover:bg-transparent",
							actionButtonClass,
						)}
						aria-label={buttonContent.text}
					>
						{(isSubmitting || isRegistering) && <Loader2 className="size-3 animate-spin" />}
						{buttonContent.text}
					</Button>
				</div>

				<OrderSummary
					liqPrice={liqPrice}
					liqWarning={liqWarning}
					orderValue={orderValue}
					marginRequired={marginRequired}
					estimatedFee={estimatedFee}
					slippageBps={slippageBps}
					szDecimals={market?.szDecimals}
					onSlippageClick={openSettingsDialog}
					marketKind={market?.kind}
				/>
			</div>

			<WalletDialog open={activeDialog === "wallet"} onOpenChange={(open) => setActiveDialog(open ? "wallet" : null)} />

			<OrderToast />
		</div>
	);
}
