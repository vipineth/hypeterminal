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
	ARBITRUM_CHAIN_ID,
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
} from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatPrice, formatUSD, szDecimalsToPriceDecimals } from "@/lib/format";
import { useSelectedResolvedMarket, useTradingAgent } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useExchangeTwapOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeTwapOrder";
import { useSubClearinghouseState } from "@/lib/hyperliquid/hooks/subscription";
import type { MarginMode } from "@/lib/trade/margin-mode";
import {
	calc,
	clampInt,
	formatDecimalFloor,
	isPositive,
	parseNumberOrZero,
	toFixed,
	toNumber,
} from "@/lib/trade/numbers";
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
import {
	canUseTpSl as canUseTpSlForOrder,
	type ExchangeOrder,
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
import { formatPriceForOrder, formatSizeForOrder } from "@/lib/trade/orders";
import { validateSlPrice, validateTpPrice } from "@/lib/trade/tpsl";
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
import { GlobalSettingsDialog } from "../components/global-settings-dialog";
import { WalletDialog } from "../components/wallet-dialog";
import { AdvancedOrderDropdown } from "./advanced-order-dropdown";
import { DepositModal } from "./deposit-modal";
import { LeverageControl, useAssetLeverage } from "./leverage-control";
import { MarginModeDialog } from "./margin-mode-dialog";
import { MarginModeToggle } from "./margin-mode-toggle";
import { OrderSummary } from "./order-summary";
import { OrderToast } from "./order-toast";
import { SideToggle } from "./side-toggle";
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

function getMarketPrice(ctxMarkPx: unknown, midPx: unknown): number {
	if (typeof ctxMarkPx === "number") return ctxMarkPx;
	if (typeof midPx === "number") return midPx;
	return 0;
}

function getActionButtonClass(variant: ButtonContent["variant"]): string {
	if (variant === "cyan") {
		return "bg-terminal-cyan/20 border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/30";
	}
	if (variant === "buy") {
		return "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30";
	}
	return "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30";
}

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
	const { mutateAsync: placeOrder, isPending: isSubmittingOrder } = useExchangeOrder();
	const { mutateAsync: placeTwapOrder, isPending: isSubmittingTwap } = useExchangeTwapOrder();

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
	const sizeInput = useOrderSize();
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
	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [depositModalOpen, setDepositModalOpen] = useState(false);
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
	const [marginModeDialogOpen, setMarginModeDialogOpen] = useState(false);

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

	const accountValue = parseNumberOrZero(clearinghouse?.crossMarginSummary?.accountValue);
	const marginUsed = parseNumberOrZero(clearinghouse?.crossMarginSummary?.totalMarginUsed);
	const availableBalance = Math.max(0, calc.subtract(accountValue, marginUsed) ?? 0);

	const position =
		!clearinghouse?.assetPositions || !market?.coin
			? null
			: (clearinghouse.assetPositions.find((p) => p.position.coin === market.coin) ?? null);
	const positionSize = parseNumberOrZero(position?.position?.szi);

	const ctxMarkPx = market?.ctxNumbers?.markPx;
	const markPx = getMarketPrice(ctxMarkPx, market?.midPxNumber);
	const price = getOrderPrice(
		orderType,
		markPx,
		limitPriceInput,
		triggerPriceInput,
		scaleStartPriceInput,
		scaleEndPriceInput,
	);

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
		() => getOrderMetrics({ sizeValue, price, leverage, orderType }),
		[leverage, orderType, price, sizeValue],
	);

	const { liqPrice, liqWarning } = useMemo(
		() => getLiquidationInfo({ price, sizeValue, leverage, side }),
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
		if (usesLimitPrice && !price) errors.push(t`Enter limit price`);
		if (usesTriggerPrice && !isPositive(triggerPriceNum)) errors.push(t`Enter trigger price`);
		if (!sizeValue || sizeValue <= 0) errors.push(t`Enter size`);
		if (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD) errors.push(t`Min order $10`);
		if (sizeValue > maxSize && maxSize > 0) errors.push(t`Exceeds max size`);

		if (tpSlEnabled && canUseTpSl) {
			const hasTp = isPositive(tpPriceNum);
			const hasSl = isPositive(slPriceNum);
			if (!hasTp && !hasSl) errors.push(t`Enter TP or SL price`);
			if (hasTp && !validateTpPrice(price, tpPriceNum, side)) {
				errors.push(side === "buy" ? t`TP must be above entry` : t`TP must be below entry`);
			}
			if (hasSl && !validateSlPrice(price, slPriceNum, side)) {
				errors.push(side === "buy" ? t`SL must be below entry` : t`SL must be above entry`);
			}
		}

		if (usesTriggerPrice && isPositive(triggerPriceNum) && markPx > 0) {
			if (stopOrder) {
				const needsAbove = side === "buy";
				if (needsAbove && triggerPriceNum <= markPx) errors.push(t`Stop trigger must be above mark`);
				if (!needsAbove && triggerPriceNum >= markPx) errors.push(t`Stop trigger must be below mark`);
			}
			if (takeProfitOrder) {
				const needsAbove = side === "sell";
				if (needsAbove && triggerPriceNum <= markPx) errors.push(t`Take profit trigger must be above mark`);
				if (!needsAbove && triggerPriceNum >= markPx) errors.push(t`Take profit trigger must be below mark`);
			}
		}

		if (scaleOrder) {
			const levels = clampInt(Math.round(scaleLevelsNum ?? 0), 0, 100);
			if (!isPositive(scaleStartPriceNum) || !isPositive(scaleEndPriceNum)) errors.push(t`Enter price range`);
			if (levels < 2 || levels > 20) errors.push(t`Scale levels must be 2-20`);
			if (isPositive(scaleStartPriceNum) && isPositive(scaleEndPriceNum) && scaleStartPriceNum === scaleEndPriceNum) {
				errors.push(t`Start and end must differ`);
			}
			if (levels >= 2 && sizeValue > 0) {
				const averagePrice = price > 0 ? price : markPx;
				const perLevelSize = sizeValue / levels;
				const perLevelNotional = averagePrice > 0 ? perLevelSize * averagePrice : 0;
				if (perLevelNotional > 0 && perLevelNotional < ORDER_MIN_NOTIONAL_USD) {
					errors.push(t`Scale level below min notional`);
				}
			}
		}

		if (twapOrder) {
			const minutes = Math.round(twapMinutesNum ?? 0);
			if (minutes < 5 || minutes > 1440) errors.push(t`TWAP minutes must be 5-1440`);
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
		triggerPriceNum,
		twapMinutesNum,
		scaleStartPriceNum,
		scaleEndPriceNum,
		scaleLevelsNum,
		stopOrder,
		takeProfitOrder,
		scaleOrder,
		twapOrder,
		usesLimitPrice,
		usesTriggerPrice,
		canUseTpSl,
		side,
	]);

	const sizeHasError = (sizeValue > maxSize && maxSize > 0) || (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD);

	function applySizePercent(pct: number) {
		if (maxSize <= 0) return;
		setHasUserSized(true);
		const newSize = calc.percent(maxSize, pct) ?? 0;
		if (sizeMode === "usd" && conversionPx > 0) {
			setSize(toFixed(calc.multiply(newSize, conversionPx), 2));
			return;
		}
		setSize(formatDecimalFloor(newSize, market?.szDecimals ?? 0) || "");
	}

	function handleSizeModeToggle() {
		const newMode = sizeMode === "asset" ? "usd" : "asset";
		if (conversionPx > 0 && sizeValue > 0) {
			setHasUserSized(true);
			setSize(
				newMode === "usd"
					? toFixed(calc.multiply(sizeValue, conversionPx), 2)
					: formatDecimalFloor(sizeValue, market?.szDecimals ?? 0) || "",
			);
		}
		setSizeMode(newMode);
	}

	const isRegistering = registerStatus === "signing" || registerStatus === "verifying";

	const handleMarginModeConfirm = useCallback(
		async (mode: MarginMode) => {
			await switchMarginMode(mode);
		},
		[switchMarginMode],
	);

	const handleRegister = useCallback(() => {
		if (isRegistering) return;
		setApprovalError(null);
		registerAgent().catch((error) => {
			const message = error instanceof Error ? error.message : t`Failed to enable trading`;
			setApprovalError(message);
		});
	}, [isRegistering, registerAgent]);

	const handleSubmit = useCallback(async () => {
		if (!validation.canSubmit || isSubmitting) return;
		if (typeof market?.assetIndex !== "number") return;

		const szDecimals = market.szDecimals ?? 0;
		const formattedSize = formatSizeForOrder(sizeValue, szDecimals);

		const orderId = addOrder({
			market: market.coin,
			side,
			size: formattedSize,
			status: "pending",
		});

		try {
			if (twapOrder) {
				const minutes = clampInt(Math.round(twapMinutesNum ?? 0), 5, 1440);
				const result = await placeTwapOrder({
					twap: {
						a: market.assetIndex,
						b: side === "buy",
						s: formattedSize,
						r: reduceOnly,
						m: minutes,
						t: twapRandomize,
					},
				});
				const status = result.response?.data?.status;
				if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
					throw new Error(status.error);
				}
				updateOrder(orderId, { status: "success", fillPercent: 100 });
			} else {
				const orders: ExchangeOrder[] = [];
				const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
				const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);

				if (scaleOrder) {
					const levels = clampInt(Math.round(scaleLevelsNum ?? 0), 2, 20);
					const start = parseNumberOrZero(scaleStartPriceInput);
					const end = parseNumberOrZero(scaleEndPriceInput);
					const step = levels > 1 ? (end - start) / (levels - 1) : 0;
					const perLevelSize = sizeValue / levels;
					for (let i = 0; i < levels; i += 1) {
						const levelPrice = start + step * i;
						orders.push({
							a: market.assetIndex,
							b: side === "buy",
							p: formatPriceForOrder(levelPrice),
							s: formatSizeForOrder(perLevelSize, szDecimals),
							r: reduceOnly,
							t: { limit: { tif } },
						});
					}
				} else if (triggerOrder) {
					const triggerPx = formatPriceForOrder(parseNumberOrZero(triggerPriceInput));
					const limitPx = formatPriceForOrder(parseNumberOrZero(limitPriceInput));
					orders.push({
						a: market.assetIndex,
						b: side === "buy",
						p: usesLimitPrice ? limitPx : triggerPx,
						s: formattedSize,
						r: reduceOnly,
						t: {
							trigger: {
								isMarket: !usesLimitPrice,
								triggerPx,
								tpsl: stopOrder ? "sl" : "tp",
							},
						},
					});
				} else {
					const orderPrice = getExecutedPrice(orderType, side, markPx, slippageBps, price);
					const formattedPrice = formatPriceForOrder(orderPrice);

					orders.push({
						a: market.assetIndex,
						b: side === "buy",
						p: formattedPrice,
						s: formattedSize,
						r: reduceOnly,
						t: orderType === "market" ? { limit: { tif: "FrontendMarket" as const } } : { limit: { tif } },
					});

					if (hasTp) {
						orders.push({
							a: market.assetIndex,
							b: side !== "buy",
							p: formatPriceForOrder(tpPriceNum),
							s: formattedSize,
							r: true,
							t: { trigger: { isMarket: true, triggerPx: formatPriceForOrder(tpPriceNum), tpsl: "tp" } },
						});
					}

					if (hasSl) {
						orders.push({
							a: market.assetIndex,
							b: side !== "buy",
							p: formatPriceForOrder(slPriceNum),
							s: formattedSize,
							r: true,
							t: { trigger: { isMarket: true, triggerPx: formatPriceForOrder(slPriceNum), tpsl: "sl" } },
						});
					}
				}

				const grouping = hasTp || hasSl ? "positionTpsl" : "na";
				const result = await placeOrder({ orders, grouping });

				const status = result.response?.data?.statuses?.[0];
				if (status && typeof status === "object" && "error" in status && typeof status.error === "string") {
					throw new Error(status.error);
				}
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
		scaleOrder,
		isSubmitting,
		stopOrder,
		twapOrder,
		triggerOrder,
		limitPriceInput,
		market?.assetIndex,
		market?.coin,
		market?.szDecimals,
		markPx,
		orderType,
		placeOrder,
		placeTwapOrder,
		price,
		reduceOnly,
		scaleEndPriceInput,
		scaleLevelsNum,
		scaleStartPriceInput,
		side,
		sizeValue,
		slippageBps,
		slPriceNum,
		tpPriceNum,
		tpSlEnabled,
		triggerPriceInput,
		twapMinutesNum,
		twapRandomize,
		updateOrder,
		usesLimitPrice,
		canUseTpSl,
		validation.canSubmit,
		resetForm,
		tif,
	]);

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
			return { text: t`Connect Wallet`, action: () => setWalletDialogOpen(true), disabled: false, variant: "cyan" };
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
			return { text: t`Deposit`, action: () => setDepositModalOpen(true), disabled: false, variant: "cyan" };
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
	const actionButtonClass = getActionButtonClass(buttonContent.variant);

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
						<AdvancedOrderDropdown orderType={orderType} onOrderTypeChange={setOrderType} />
					</div>

					<SideToggle side={side} onSideChange={setSide} />
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
								setSize(e.target.value);
							}}
							className={cn(
								"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								sizeHasError && "border-terminal-red focus:border-terminal-red",
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
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Trigger Price (USDC)`}</div>
							{markPx > 0 && (
								<Button
									variant="ghost"
									size="none"
									onClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan hover:bg-transparent tabular-nums"
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
								"w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								usesTriggerPrice &&
									!isPositive(triggerPriceNum) &&
									sizeValue > 0 &&
									"border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{usesLimitPrice && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Limit Price (USDC)`}</div>
							{markPx > 0 && (
								<Button
									variant="ghost"
									size="none"
									onClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(market?.szDecimals ?? 4)))}
									className="text-4xs text-muted-foreground hover:text-terminal-cyan hover:bg-transparent tabular-nums"
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
								"w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
								usesLimitPrice && !price && sizeValue > 0 && "border-terminal-red focus:border-terminal-red",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				{showTif && (
					<div className="space-y-1.5">
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Time in Force`}</div>
						<Select value={tif} onValueChange={(value) => setTif(value as LimitTif)} disabled={isFormDisabled}>
							<SelectTrigger className="w-full h-8 text-sm bg-background/50 border-border/60">
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
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Start Price (USDC)`}</div>
							<NumberInput
								placeholder="0.00"
								value={scaleStartPriceInput}
								onChange={(e) => setScaleStart(e.target.value)}
								className="w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`End Price (USDC)`}</div>
							<NumberInput
								placeholder="0.00"
								value={scaleEndPriceInput}
								onChange={(e) => setScaleEnd(e.target.value)}
								className="w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Number of Orders`}</div>
								<span className="text-4xs text-muted-foreground">{t`2-20`}</span>
							</div>
							<NumberInput
								placeholder="4"
								value={String(scaleLevelsNum)}
								onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
								allowDecimals={false}
								className="w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
					</>
				)}

				{twapOrder && (
					<>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="text-4xs uppercase tracking-wider text-muted-foreground">{t`Duration (Minutes)`}</div>
								<span className="text-4xs text-muted-foreground">{t`5-1440`}</span>
							</div>
							<NumberInput
								placeholder="30"
								value={String(twapMinutesNum)}
								onChange={(e) => setTwapMinutes(Number(e.target.value) || 30)}
								allowDecimals={false}
								className="w-full h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
								disabled={isFormDisabled}
							/>
						</div>
						<div className="flex items-center gap-2 text-3xs">
							<Checkbox
								checked={twapRandomize}
								onCheckedChange={(checked) => setTwapRandomize(checked === true)}
								disabled={isFormDisabled}
							/>
							<span className={cn(isFormDisabled && "text-muted-foreground")}>{t`Randomize timing`}</span>
						</div>
					</>
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
						{canUseTpSl && (
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
						)}
					</div>

					{tpSlEnabled && canUseTpSl && (
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
					onSlippageClick={() => setSettingsDialogOpen(true)}
				/>
			</div>

			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
			<GlobalSettingsDialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen} />

			<OrderToast />
		</div>
	);
}
