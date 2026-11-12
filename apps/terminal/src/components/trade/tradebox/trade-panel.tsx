import { Button } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { APPROVAL_ERROR_DISMISS_MS } from "@/config/time";
import { getPositionDex } from "@/domain/market";
import { getMarketQuoteToken } from "@/domain/trade/balances";
import { getLiquidationInfo, getOrderMetrics } from "@/domain/trade/order/metrics";
import { getOrderPrice } from "@/domain/trade/order/price";
import { useFeeRates } from "@/hooks/trade/use-fee-rates";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { useOrderSubmit } from "@/hooks/trade/use-order-submit";
import { cn } from "@/lib/cn";
import { useAgentRegistration, useAgentStatus, useSelectedMarketInfo, useUserPositions } from "@/lib/hyperliquid";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isScaleOrderType,
	isStopOrderType,
	isTakeProfitOrderType,
	isTakerOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	usesLimitPrice as usesLimitPriceForOrder,
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
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { WalletModal } from "../components/wallet-modal";
import { MarginModeModal } from "./margin-mode-modal";
import { OrderSummary } from "./order-summary";
import { OrderToast } from "./order-toast";
import { ScaleOrderSummary } from "./scale-order-summary";
import { TradeFormFields } from "./trade-form-fields";
import { TradeHeader } from "./trade-header";
import { TwapOrderSummary } from "./twap-order-summary";

export function TradePanel() {
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
		currentLeverage,
		pendingLeverage,
		maxLeverage,
		setPendingLeverage,
		resetPendingLeverage,
		applyMarginAndLeverage,
		isSwitchingMode,
		switchModeError,
	} = useOrderEntryData({ market, side, markPx, sizeMode, sizeInput });

	const { takerRate, makerRate } = useFeeRates(market?.kind);
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

	const { setSide, setOrderType, setSizeMode, setSize, setLimitPrice } = useOrderEntryActions();

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

	const tpPriceNum = toNumber(tpPriceInput);
	const slPriceNum = toNumber(slPriceInput);
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

	const { marginRequired, estimatedFee } = getOrderMetrics({ sizeValue, price, leverage, feeRate });
	const { liqPrice, liqWarning } = getLiquidationInfo({ price, sizeValue, leverage, side });

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

	async function handleMarginApply(mode: MarginMode, leverageValue: number) {
		await applyMarginAndLeverage(mode, leverageValue);
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
		if (!market || !baseToken || typeof market.assetId !== "number") return;

		await submitOrder({
			market: { assetId: market.assetId, szDecimals: market.szDecimals },
			baseToken,
			side,
			orderType,
			sizeValue,
			price,
			markPx,
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
			tpPriceNum,
			slPriceNum,
			twapOrder,
			scaleOrder,
			triggerOrder,
		});
	}

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
		sideLabel: sideLabels[side],
		isSubmitting,
		onConnectWallet: () => setActiveModal("wallet"),
		onDeposit: () => openDepositModal("deposit"),
		onRegister: handleRegister,
		onSubmit: handleSubmit,
	});

	function renderSummary() {
		if (twapOrder) {
			return (
				<TwapOrderSummary
					twapMinutesNum={twapMinutesNum}
					sizeValue={sizeValue}
					orderValue={orderValue}
					estimatedFee={estimatedFee}
					feeRatePercent={feeRatePercent}
					baseToken={baseToken}
					szDecimals={market?.szDecimals}
				/>
			);
		}
		if (scaleOrder) {
			return (
				<ScaleOrderSummary
					scaleStart={scaleStartPriceNum}
					scaleEnd={scaleEndPriceNum}
					scaleLevels={scaleLevelsNum}
					orderValue={orderValue}
					marginRequired={marginRequired}
					estimatedFee={estimatedFee}
					feeRatePercent={feeRatePercent}
					szDecimals={market?.szDecimals}
					marketKind={market?.kind}
				/>
			);
		}
		return (
			<OrderSummary
				liqPrice={liqPrice}
				liqWarning={liqWarning}
				orderValue={orderValue}
				marginRequired={marginRequired}
				estimatedFee={estimatedFee}
				feeRatePercent={feeRatePercent}
				slippagePercent={slippagePercent}
				szDecimals={market?.szDecimals}
				onSlippageClick={openSettingsDialog}
				orderType={orderType}
				marketKind={market?.kind}
			/>
		);
	}

	return (
		<div className="flex flex-col bg-surface">
			<MarginModeModal
				open={activeModal === "marginMode"}
				onOpenChange={(open) => {
					if (!open) resetPendingLeverage();
					setActiveModal(open ? "marginMode" : null);
				}}
				currentMode={marginMode}
				currentLeverage={currentLeverage}
				pendingLeverage={pendingLeverage}
				maxLeverage={maxLeverage}
				onPendingLeverageChange={setPendingLeverage}
				hasPosition={hasPosition}
				isOnlyIsolated={capabilities.isOnlyIsolated}
				isUpdating={isSwitchingMode}
				updateError={switchModeError}
				showLeverage={capabilities.isLeveraged}
				onApply={handleMarginApply}
			/>

			<div className="flex flex-col gap-5 px-3 py-3">
				<TradeHeader
					orderType={orderType}
					side={side}
					sideLabels={sideLabels}
					marketKind={market?.kind}
					onOrderTypeChange={setOrderType}
					onSideChange={setSide}
					marginMode={marginMode}
					leverage={leverage}
					onMarginLeverageClick={() => setActiveModal("marginMode")}
					isLeveraged={capabilities.isLeveraged}
				/>

				<TradeFormFields
					price={price}
					positionSize={positionSize}
					swapTargetToken={swapTargetToken}
					onSizeModeToggle={handleSizeModeToggle}
					onSizePercentApply={handleSizePercentApply}
					onDepositClick={() => openDepositModal("deposit")}
					onSwapClick={() => swapTargetToken && openSwapModal(DEFAULT_QUOTE_TOKEN, swapTargetToken)}
				/>

				<div className="flex flex-col gap-3 pt-5 pb-1">
					{validation.errors.length > 0 && isConnected && availableBalance > 0 && (
						<div className="text-xs text-error">{validation.errors.join(" • ")}</div>
					)}

					{approvalError && <div className="text-xs text-error">{approvalError}</div>}

					<Button
						variant="filled"
						size="xs"
						intent={buttonContent.variant === "buy" ? "brand" : buttonContent.variant === "sell" ? "error" : "brand"}
						onClick={buttonContent.action}
						disabled={buttonContent.disabled}
						className={cn(
							"w-full px-3 py-2 text-sm font-semibold focus-visible:outline-offset-1",
							buttonContent.variant === "buy" && "bg-success text-background hover:opacity-90",
							buttonContent.variant === "sell" && "text-background",
						)}
						aria-label={buttonContent.text}
						iconLeft={isSubmitting || isRegistering ? <SpinnerGapIcon className="size-3 animate-spin" /> : undefined}
					>
						{buttonContent.text}
					</Button>
				</div>

				{renderSummary()}
			</div>

			<WalletModal open={activeModal === "wallet"} onOpenChange={(open) => setActiveModal(open ? "wallet" : null)} />

			<OrderToast />
		</div>
	);
}

function getSwapTargetToken(market: NonNullable<ReturnType<typeof useSelectedMarketInfo>["data"]> | undefined) {
	if (market?.kind !== "builderPerp") return null;

	const quoteToken = getMarketQuoteToken(market);
	if (quoteToken === DEFAULT_QUOTE_TOKEN) return null;

	return quoteToken;
}
