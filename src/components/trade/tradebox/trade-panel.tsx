import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { DEFAULT_QUOTE_TOKEN, TWAP_MINUTES_MAX, TWAP_MINUTES_MIN } from "@/config/constants";
import { getMarketQuoteToken } from "@/domain/trade/balances";
import { getLiquidationInfo, getOrderMetrics } from "@/domain/trade/order/metrics";
import { getOrderPrice } from "@/domain/trade/order/price";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { formatPriceForOrder, formatSizeForOrder, throwIfResponseError } from "@/domain/trade/orders";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { cn } from "@/lib/cn";
import { useAgentRegistration, useAgentStatus, useSelectedMarketInfo, useUserPositions } from "@/lib/hyperliquid";
import { useExchangeOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeOrder";
import { useExchangeTwapOrder } from "@/lib/hyperliquid/hooks/exchange/useExchangeTwapOrder";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { clampInt, isPositive, toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isScaleOrderType,
	isStopOrderType,
	isTakeProfitOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	usesLimitPrice as usesLimitPriceForOrder,
} from "@/lib/trade/order-types";
import type { ActiveDialog, ButtonContent } from "@/lib/trade/types";
import { useButtonContent } from "@/lib/trade/use-button-content";
import { perpInput, spotInput, useOrderValidation } from "@/lib/trade/use-order-validation";
import { useDepositModalActions, useSettingsDialogActions, useSwapModalActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps, useMarketOrderSlippagePercent } from "@/stores/use-global-settings-store";
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
import { LeverageControl } from "./leverage-control";
import { MarginModeDialog, MarginModeToggle } from "./margin-mode-dialog";
import { OrderSummary } from "./order-summary";
import { OrderToast } from "./order-toast";
import { TradeFormFields } from "./trade-form-fields";
import { TradeHeader } from "./trade-header";

function getActionButtonClass(variant: ButtonContent["variant"]): string {
	if (variant === "cyan") {
		return "bg-primary-default border-primary-default text-white hover:bg-primary-hover text-sm font-medium normal-case";
	}
	if (variant === "buy") {
		return "bg-market-up-100 border-market-up-600 text-market-up-600 hover:bg-market-up-100/30";
	}
	return "bg-market-down-100 border-market-down-600 text-market-down-600 hover:bg-market-down-600/30";
}

export function TradePanel() {
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
	const slippagePercent = useMarketOrderSlippagePercent();
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
		maxSize,
		sizeValue,
		orderValue,
		sideLabels,
		getSizeForPercent,
		convertSizeForModeToggle,
		leverage,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
	} = useOrderEntryData({ market, side, markPx, sizeMode, sizeInput });

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
	const canUseTpSl = canUseTpSlForOrder(orderType);

	const { setSide, setOrderType, setSizeMode, setSize, setLimitPrice, resetForm } = useOrderEntryActions();

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

	useEffect(() => {
		if (isSpotMarket && triggerOrder) {
			setOrderType("market");
		}
	}, [isSpotMarket, triggerOrder, setOrderType]);

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
					usesTriggerPrice: usesLimitPriceForOrder(orderType) ? false : isTriggerOrderType(orderType),
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

	function handleSizeModeToggle() {
		const newMode = sizeMode === "base" ? "quote" : "base";
		const convertedSize = convertSizeForModeToggle();
		if (convertedSize) {
			setSize(convertedSize);
		}
		setSizeMode(newMode);
	}

	function handleSizePercentApply(pct: number) {
		if (maxSize <= 0) return;
		const newSize = getSizeForPercent(pct);
		if (newSize) setSize(newSize);
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
		const formattedPrice = formatPriceForOrder(price);

		const getQueueOrderType = () => {
			if (twapOrder) return "twap" as const;
			if (scaleOrder) return "scale" as const;
			if (triggerOrder) return "trigger" as const;
			if (orderType === "limit") return "limit" as const;
			return "market" as const;
		};

		const hasTp = tpSlEnabled && canUseTpSl && isPositive(tpPriceNum);
		const hasSl = tpSlEnabled && canUseTpSl && isPositive(slPriceNum);

		const orderId = addOrder({
			market: baseToken,
			side,
			size: formattedSize,
			price: formattedPrice,
			orderType: getQueueOrderType(),
			tpPrice: hasTp ? formatPriceForOrder(tpPriceNum ?? 0) : undefined,
			slPrice: hasSl ? formatPriceForOrder(slPriceNum ?? 0) : undefined,
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
				const plan = buildOrderPlan({
					kind: "entry",
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
				});

				if (plan.errors.length > 0) {
					updateOrder(orderId, { status: "failed", error: plan.errors.join("; ") });
					return;
				}

				const result = await placeOrder({ orders: plan.orders, grouping: plan.grouping });
				const statuses = result.response?.data?.statuses ?? [];

				const errors: string[] = [];
				for (const status of statuses) {
					if (status && typeof status === "object" && "error" in status) {
						errors.push((status as { error: string }).error);
					}
				}

				if (errors.length > 0) {
					updateOrder(orderId, { status: "failed", error: errors.join("; ") });
				} else if (statuses.length === 0) {
					updateOrder(orderId, { status: "failed", error: t`No response from exchange` });
				} else {
					updateOrder(orderId, { status: "success", fillPercent: 100 });
				}
			}

			resetForm();
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
		tif,
		tpPriceNum,
		tpSlEnabled,
		triggerOrder,
		triggerPriceInput,
		twapMinutesNum,
		twapOrder,
		twapRandomize,
		updateOrder,
		validation.canSubmit,
	]);

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

	const actionButtonClass = getActionButtonClass(buttonContent.variant);

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface-execution">
			{capabilities.isLeveraged && (
				<div className="p-2 border-b border-border-200/60 flex items-center justify-between">
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
				<TradeHeader
					orderType={orderType}
					side={side}
					sideLabels={sideLabels}
					marketKind={market?.kind}
					onOrderTypeChange={setOrderType}
					onSideChange={setSide}
				/>

				<TradeFormFields
					price={price}
					positionSize={positionSize}
					swapTargetToken={swapTargetToken}
					reduceOnlyId={reduceOnlyId}
					tpSlId={tpSlId}
					onSizeModeToggle={handleSizeModeToggle}
					onSizePercentApply={handleSizePercentApply}
					onDepositClick={() => openDepositModal("deposit")}
					onSwapClick={() => swapTargetToken && openSwapModal(DEFAULT_QUOTE_TOKEN, swapTargetToken)}
				/>

				<div className="space-y-2">
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && (
						<div className="text-4xs text-market-down-600">{validation.errors.join(" • ")}</div>
					)}

					{approvalError && <div className="text-4xs text-market-down-600">{approvalError}</div>}

					<Button
						variant="contained"
						tone="accent"
						size="lg"
						onClick={buttonContent.action}
						disabled={buttonContent.disabled}
						className={cn("w-full")}
						aria-label={buttonContent.text}
					>
						{(isSubmitting || isRegistering) && <SpinnerGapIcon className="size-3 animate-spin" />}
						{buttonContent.text}
					</Button>
				</div>

				<OrderSummary
					liqPrice={liqPrice}
					liqWarning={liqWarning}
					orderValue={orderValue}
					marginRequired={marginRequired}
					estimatedFee={estimatedFee}
					slippagePercent={slippagePercent}
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
