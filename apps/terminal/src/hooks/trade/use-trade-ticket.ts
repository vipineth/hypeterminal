import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { APPROVAL_ERROR_DISMISS_MS } from "@/config/time";
import { getPositionDex } from "@/domain/market";
import { getMarketFeeRates } from "@/domain/market/fees";
import { isListed } from "@/domain/market/model";
import { getMarketQuoteToken } from "@/domain/trade/balances";
import { getFundingNeed } from "@/domain/trade/dex-transfer";
import { getLiquidationInfo, getOrderMetrics } from "@/domain/trade/order/metrics";
import { getOrderPrice } from "@/domain/trade/order/price";
import { useFeeRates } from "@/hooks/trade/use-fee-rates";
import { useLiveMarkPx } from "@/hooks/trade/use-live-mark-px";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { getOpeningLegs, type OrderSubmitInput, useOrderSubmit } from "@/hooks/trade/use-order-submit";
import {
	type UnifiedMarketInfo,
	useAgentRegistration,
	useAgentStatus,
	useSelectedMarketInfo,
	useUserPositions,
} from "@/lib/hyperliquid";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isScaleOrderType,
	isStopOrderType,
	isTakerOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	usesLimitPrice as usesLimitPriceForOrder,
	usesTriggerPrice as usesTriggerPriceForOrder,
} from "@/lib/trade/order-types";
import type { ActiveModal } from "@/lib/trade/types";
import { useButtonContent } from "@/lib/trade/use-button-content";
import { perpInput, spotInput, useOrderValidation } from "@/lib/trade/use-order-validation";
import { useDepositModalActions, useSettingsDialogActions, useSwapModalActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps, useMarketOrderSlippagePercent } from "@/stores/use-global-settings-store";
import {
	useLimitPrice,
	useOrderEntryActions,
	useOrderSide,
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
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";

interface Options {
	onSubmitted?: () => void;
}

const TENTHS_OF_BPS_PER_UNIT = 100_000;

export function useTradeTicket({ onSubmitted }: Options = {}) {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const switchChain = useSwitchChain();
	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedMarketInfo();
	const userPositions = useUserPositions();

	const { isReady: isAgentReady, isLoading: isAgentLoading } = useAgentStatus();
	const { register: registerAgent, status: registerStatus } = useAgentRegistration();
	const { handleSubmit: submitOrder, isSubmitting } = useOrderSubmit();

	const slippageBps = useMarketOrderSlippageBps();
	const slippagePercent = useMarketOrderSlippagePercent();
	const side = useOrderSide();
	const markPx = toNumberOrZero(market?.markPx);
	const sizeMode = useSizeMode();

	const entry = useOrderEntryData({ market, side, markPx });
	const { isSpotMarket, baseToken, quoteToken, spotBalance, availableBalance, maxSize, sizeValue, orderValue } = entry;

	const { takerRate, makerRate } = getMarketFeeRates(useFeeRates(market?.kind), market);
	const selectedPrice = useSelectedPrice();
	const orderType = useOrderType();
	const storedReduceOnly = useReduceOnly();
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
	const triggerOrder = isTriggerOrderType(orderType);
	const twapOrder = isTwapOrderType(orderType);
	const scaleOrder = isScaleOrderType(orderType);
	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const canUseTpSl = entry.capabilities.hasTpSl && canUseTpSlForOrder(orderType);
	const reduceOnly = entry.capabilities.hasReduceOnly && storedReduceOnly;
	const liveMarkPx = useLiveMarkPx(isSpotMarket ? null : (market?.name ?? null));

	const { setOrderType, setLimitPrice } = useOrderEntryActions();

	const [approvalError, setApprovalError] = useState<string | null>(null);
	const [activeModal, setActiveModal] = useState<ActiveModal>(null);

	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { open: openSwapModal } = useSwapModalActions();

	const swapTargetToken = getSwapTargetToken(market);

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

	const triggerPriceNum = toNumber(triggerPriceInput);
	const scaleStartPriceNum = toNumber(scaleStartPriceInput);
	const scaleEndPriceNum = toNumber(scaleEndPriceInput);

	const position = market?.name ? userPositions.getPosition(market.name, getPositionDex(market)) : null;
	const positionSize = toNumberOrZero(position?.szi);

	const price = getOrderPrice(
		orderType,
		markPx,
		limitPriceInput,
		triggerPriceInput,
		scaleStartPriceInput,
		scaleEndPriceInput,
	);

	const feeRate = isTakerOrderType(orderType) ? takerRate : makerRate;
	const feeRatePercent = `${(feeRate * 100).toFixed(4)}%`;

	const { marginRequired, estimatedFee } = getOrderMetrics({ sizeValue, price, leverage: entry.leverage, feeRate });
	const { liqPrice, liqWarning } = getLiquidationInfo({ price, sizeValue, leverage: entry.leverage, side });
	const orderInput: OrderSubmitInput | null =
		market && isListed(market) && baseToken
			? {
					market,
					baseToken,
					side,
					orderType,
					sizeValue: entry.orderSize,
					markPx: market.markPx ?? "",
					slippageBps,
					reduceOnly,
					tif,
					limitPriceInput,
					triggerPriceInput,
					scaleStartPriceInput,
					scaleEndPriceInput,
					scaleLevelsNum,
					twapMinutesNum,
					twapRandomize,
					tpSlEnabled,
					canUseTpSl,
					tpPriceInput,
					slPriceInput,
					twapOrder,
					scaleOrder,
					triggerOrder,
				}
			: null;
	const fundingNeed = orderInput
		? getFundingNeed({
				legs: getOpeningLegs(orderInput),
				markPx: orderInput.markPx,
				leverage: entry.currentLeverage,
				feeRate: takerRate + Number(DEFAULT_BUILDER_CONFIG?.f ?? 0) / TENTHS_OF_BPS_PER_UNIT,
			})
		: 0;

	const needsAgentApproval = !isAgentReady;
	const canApprove = !!walletClient && !!address;

	const baseInput = {
		isConnected,
		isWalletLoading,
		availableBalance,
		collateralPending: entry.collateral.status === "pending",
		hasMarket: !!market,
		hasAssetIndex: typeof market?.assetId === "number",
		needsAgentApproval,
		isReadyToTrade: isAgentReady,
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
					isDelisted: market?.isDelisted === true,
					markPx,
					maxSize,
					usesTriggerPrice: usesTriggerPriceForOrder(orderType),
					triggerPriceNum,
					triggerPriceInput,
					stopOrder,
					scaleOrder,
					twapOrder,
					scaleStartPriceNum,
					scaleEndPriceNum,
					scaleLevelsNum,
					twapMinutesNum,
					tpSlEnabled,
					canUseTpSl,
					tpPriceInput,
					slPriceInput,
					limitPriceInput,
					liveMarkPx,
					szDecimals: market?.szDecimals ?? 0,
				}),
	);

	function handleSizePercentApply(pct: number) {
		if (maxSize <= 0) return;
		const newSize = entry.getSizeForPercent(pct);
		if (newSize) entry.setSizeInput(newSize);
	}

	const isRegistering =
		registerStatus === "approving_fee" || registerStatus === "approving_agent" || registerStatus === "verifying";

	async function handleMarginApply(mode: MarginMode, leverageValue: number) {
		await entry.applyMarginAndLeverage(mode, leverageValue);
	}

	function handleRegister() {
		if (isRegistering) return;
		setApprovalError(null);

		registerAgent().catch((error: unknown) => {
			const message = error instanceof Error ? error.message : t`Failed to enable trading`;
			setApprovalError(message);
			setTimeout(() => setApprovalError(null), APPROVAL_ERROR_DISMISS_MS);
		});
	}

	async function handleSubmit() {
		if (!validation.canSubmit || isSubmitting) return;
		if (!orderInput) return;

		const submitted = await submitOrder(orderInput);
		if (submitted) onSubmitted?.();
	}

	const buttonContent = useButtonContent({
		isConnected,
		needsChainSwitch,
		isSwitchingChain: switchChain.isPending,
		switchChain: (chainId) => switchChain.mutate({ chainId }),
		collateral: entry.collateral,
		validation,
		isAgentLoading,
		registerStatus,
		canApprove,
		side,
		sideLabel: entry.sideLabels[side],
		isSubmitting,
		onConnectWallet: () => setActiveModal("wallet"),
		onDeposit: () => openDepositModal("deposit"),
		onRegister: handleRegister,
		onSubmit: handleSubmit,
	});

	const marginModalProps = {
		open: activeModal === "marginMode",
		onOpenChange: (open: boolean) => {
			if (!open) entry.resetPendingLeverage();
			setActiveModal(open ? "marginMode" : null);
		},
		currentMode: entry.marginMode,
		currentLeverage: entry.currentLeverage,
		pendingLeverage: entry.pendingLeverage,
		maxLeverage: entry.maxLeverage,
		onPendingLeverageChange: entry.setPendingLeverage,
		hasPosition: entry.hasPosition,
		isOnlyIsolated: entry.capabilities.isOnlyIsolated,
		isUpdating: entry.isSwitchingMode,
		updateError: entry.switchModeError,
		showLeverage: entry.capabilities.isLeveraged,
		onApply: handleMarginApply,
	};

	const walletModalProps = {
		open: activeModal === "wallet",
		onOpenChange: (open: boolean) => setActiveModal(open ? "wallet" : null),
	};

	return {
		market,
		entry,
		side,
		orderType,
		sizeMode,
		markPx,
		price,
		positionSize,
		swapTargetToken,
		isConnected,
		twapOrder,
		scaleOrder,
		twapMinutesNum,
		scaleStartPriceNum,
		scaleEndPriceNum,
		scaleLevelsNum,
		feeRatePercent,
		marginRequired,
		estimatedFee,
		fundingNeed,
		liqPrice,
		liqWarning,
		slippagePercent,
		validation,
		showValidationErrors: isConnected && entry.collateral.status === "ready" && entry.shortfall === null,
		buttonContent,
		approvalError,
		isSubmitting,
		isRegistering,
		marginModalProps,
		walletModalProps,
		openMarginModal: () => setActiveModal("marginMode"),
		openDepositModal: () => openDepositModal("deposit"),
		openSettingsDialog,
		openSwapModal: () => swapTargetToken && openSwapModal(DEFAULT_QUOTE_TOKEN, swapTargetToken),
		handleSizeModeToggle: entry.toggleSizeMode,
		handleSizePercentApply,
	};
}

export type TradeTicket = ReturnType<typeof useTradeTicket>;

function getSwapTargetToken(market: UnifiedMarketInfo | undefined) {
	if (market?.kind !== "builderPerp") return null;

	const quoteToken = getMarketQuoteToken(market);
	if (quoteToken === DEFAULT_QUOTE_TOKEN) return null;

	return quoteToken;
}
