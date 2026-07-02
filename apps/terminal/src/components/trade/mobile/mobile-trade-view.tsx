import { Button, Checkbox, Slider } from "@hypeterminal/ui";
import { CaretDownIcon, PencilIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { type ChangeEvent, useEffect, useState } from "react";
import { useConnection, useSwitchChain, useWalletClient } from "wagmi";
import { NumberInput } from "@/components/ui/number-input";
import { PriceInput } from "@/components/ui/price-input";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";
import { SIZE_PERCENT_OPTIONS } from "@/config/trade";
import { UI_TEXT } from "@/config/ui-text";
import { get24hChange } from "@/domain/market";
import { getLiquidationInfo } from "@/domain/trade/order/metrics";
import { getSliderValue } from "@/domain/trade/order/size";
import { useFeeRates } from "@/hooks/trade/use-fee-rates";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { useOrderSubmit } from "@/hooks/trade/use-order-submit";
import { cn } from "@/lib/cn";
import { formatPrice, formatToken, formatUSD } from "@/lib/format";
import { useAgentRegistration, useAgentStatus, useSelectedMarketInfo } from "@/lib/hyperliquid";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { toNumberOrZero } from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isTakerOrderType,
	usesLimitPrice as usesLimitPriceForOrder,
} from "@/lib/trade/order-types";
import type { ButtonContent, Side, SizeMode } from "@/lib/trade/types";
import { perpInput, spotInput, useOrderValidation } from "@/lib/trade/use-order-validation";
import { getValueColorClass } from "@/lib/ui/value-color";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useDepositModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { useMarketOrderSlippageBps, useMarketOrderSlippagePercent } from "@/stores/use-global-settings-store";
import { useMarketActions } from "@/stores/use-market-store";
import { useOrderEntryActions, useOrderSide, useOrderType } from "@/stores/use-order-entry-store";
import { getOrderbookActionsStore, useSelectedPrice } from "@/stores/use-orderbook-actions-store";
import { TokenSelector } from "../chart/token-selector";
import { WalletModal } from "../components/wallet-modal";
import { MarginModeModal } from "../tradebox/margin-mode-modal";
import { OrderToast } from "../tradebox/order-toast";
import { TradeHeader } from "../tradebox/trade-header";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ORDER_TEXT = UI_TEXT.ORDER_ENTRY;

interface Props {
	className?: string;
}

export function MobileTradeView({ className }: Props) {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading, error: walletClientError } = useWalletClient();
	const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

	const needsChainSwitch = !!walletClientError && walletClientError.message.includes("does not match");

	const { data: market } = useSelectedMarketInfo();
	const { scope } = useExchangeScope();
	const { setSelectedMarket } = useMarketActions();

	function handleMarketChange(marketName: string) {
		setSelectedMarket(scope, marketName);
	}

	const { isReady: isAgentApproved } = useAgentStatus();
	const { register: registerAgent, status: registerStatus } = useAgentRegistration();

	const canApprove = !!walletClient && !!address;
	const isRegistering =
		registerStatus === "approving_fee" || registerStatus === "approving_agent" || registerStatus === "verifying";

	const slippageBps = useMarketOrderSlippageBps();
	const slippagePercent = useMarketOrderSlippagePercent();

	const selectedPrice = useSelectedPrice();

	const orderType = useOrderType();
	const side = useOrderSide();
	const { setOrderType, setSide } = useOrderEntryActions();
	const [sizeInput, setSizeInput] = useState("");
	const [sizeMode, setSizeMode] = useState<SizeMode>("quote");
	const [limitPriceInput, setLimitPriceInput] = useState("");
	const [reduceOnly, setReduceOnly] = useState(false);
	const [tpSlEnabled, setTpSlEnabled] = useState(false);
	const [isDraggingSlider, setIsDraggingSlider] = useState(false);
	const [dragSliderValue, setDragSliderValue] = useState(0);
	const [approvalError, setApprovalError] = useState<string | null>(null);

	const canUseTpSl = canUseTpSlForOrder(orderType);

	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [showMarginDialog, setShowMarginDialog] = useState(false);
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();

	const { handleSubmit: submitOrder, isSubmitting } = useOrderSubmit();

	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const isMarketExecution = orderType === "market" || isTakerOrderType(orderType);
	const markPx = toNumberOrZero(market?.markPx);

	const {
		isSpotMarket,
		baseToken,
		quoteToken,
		capabilities,
		szDecimals,
		availableBalance,
		availableBalanceToken,
		spotBalance,
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

	useEffect(() => {
		if (selectedPrice !== null) {
			setOrderType("limit");
			setLimitPriceInput(String(selectedPrice));
			getOrderbookActionsStore().actions.clearSelectedPrice();
		}
	}, [selectedPrice, setOrderType]);
	const price = isMarketExecution ? markPx : toNumberOrZero(limitPriceInput);
	const { takerRate, makerRate } = useFeeRates(market?.kind);
	const feeRate = isMarketExecution ? takerRate : makerRate;
	const feeRatePercent = `${(feeRate * 100).toFixed(4)}%`;
	const estimatedFee = orderValue * feeRate;
	const marginRequired = capabilities.isLeveraged && leverage > 0 ? orderValue / leverage : 0;

	const liqPrice = capabilities.isLeveraged ? getLiquidationInfo({ price, sizeValue, leverage, side }).liqPrice : null;

	const baseInput = {
		isConnected,
		isWalletLoading,
		availableBalance,
		hasMarket: !!market,
		hasAssetIndex: typeof market?.assetId === "number",
		needsAgentApproval: !isAgentApproved,
		isReadyToTrade: isAgentApproved,
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
					usesTriggerPrice: false,
					triggerPriceNum: null,
					stopOrder: false,
					takeProfitOrder: false,
					scaleOrder: false,
					twapOrder: false,
					scaleStartPriceNum: null,
					scaleEndPriceNum: null,
					scaleLevelsNum: null,
					twapMinutesNum: null,
					tpSlEnabled: false,
					canUseTpSl: false,
					tpPriceNum: null,
					slPriceNum: null,
				}),
	);

	function applySizeFromPercent(pct: number) {
		if (maxSize <= 0) return;
		setSizeInput(getSizeForPercent(pct));
	}

	function handleSizeModeToggle() {
		const newMode = sizeMode === "base" ? "quote" : "base";
		const convertedSize = convertSizeForModeToggle();
		setSizeMode(newMode);
		if (convertedSize) setSizeInput(convertedSize);
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

		const succeeded = await submitOrder({
			market: { assetId: market.assetId, szDecimals: market.szDecimals },
			baseToken,
			side,
			orderType: isMarketExecution ? "market" : "limit",
			sizeValue,
			price,
			markPx,
			slippageBps,
			reduceOnly,
			tif: "Gtc",
			limitPriceInput,
			triggerPriceInput: "",
			scaleStartPriceInput: "",
			scaleEndPriceInput: "",
			scaleLevelsNum: null,
			twapMinutesNum: null,
			twapRandomize: false,
			tpSlEnabled: false,
			canUseTpSl: false,
			tpPriceNum: null,
			slPriceNum: null,
			twapOrder: false,
			scaleOrder: false,
			triggerOrder: false,
		});

		if (succeeded) {
			setSizeInput("");
			setLimitPriceInput("");
		}
	}

	const sliderValue = isDraggingSlider ? dragSliderValue : getSliderValue(sizeValue, maxSize);

	const buttonContent = getMobileOrderButtonContent({
		isConnected,
		needsChainSwitch,
		isSwitchingChain,
		availableBalance,
		needsApproval: validation.needsApproval,
		canSubmit: validation.canSubmit,
		isRegistering,
		canApprove,
		isSubmitting,
		side,
		sideLabel: sideLabels[side],
		onConnect: () => setWalletModalOpen(true),
		onSwitchChain: handleSwitchChain,
		onDeposit: () => openDepositModal("deposit"),
		onApprove: handleApprove,
		onSubmit: handleSubmit,
	});

	const isFormDisabled = !isConnected || availableBalance <= 0;

	function formatAvailableBalance(): string {
		if (!isConnected) return FALLBACK_VALUE_PLACEHOLDER;
		const decimals = isSpotMarket && side === "sell" ? szDecimals : 2;
		return formatToken(availableBalance, decimals);
	}

	const change24h = get24hChange(market?.prevDayPx, market?.markPx);
	const priceColorClass = change24h !== null ? getValueColorClass(change24h) : "text-fg";

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
			<MarginModeModal
				open={showMarginDialog}
				onOpenChange={(open) => {
					if (!open) resetPendingLeverage();
					setShowMarginDialog(open);
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
				onApply={async (mode: MarginMode, lev: number) => applyMarginAndLeverage(mode, lev)}
			/>
			<div className="shrink-0 px-4 py-2 border-b border-stroke-weak/60 bg-surface">
				<div className="flex items-center justify-between">
					<TokenSelector selectedMarket={market} onValueChange={handleMarketChange} />
					<div className="text-right">
						<div className={cn("text-sm font-semibold tabular-nums", priceColorClass)}>
							${formatPrice(markPx || null, { szDecimals: market?.szDecimals })}
						</div>
						{typeof change24h === "number" && (
							<div className={cn("text-xs tabular-nums", getValueColorClass(change24h))}>
								{change24h >= 0 ? "+" : ""}
								{change24h.toFixed(2)}%
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="px-3 py-4 space-y-4">
					<TradeHeader
						orderType={orderType}
						side={side}
						sideLabels={sideLabels}
						marketKind={market?.kind}
						onOrderTypeChange={setOrderType}
						onSideChange={setSide}
						marginMode={marginMode}
						leverage={leverage}
						onMarginLeverageClick={() => setShowMarginDialog(true)}
						isLeveraged={capabilities.isLeveraged}
					/>

					<div className="flex items-center justify-end text-xs">
						<span className="text-fg-muted uppercase text-2xs font-medium">{ORDER_TEXT.AVAILABLE_LABEL} </span>
						<span className={cn("tabular-nums font-semibold text-xs ml-1", getValueColorClass(availableBalance))}>
							{formatAvailableBalance()}
						</span>
						<span className="ml-1 text-2xs tabular-nums text-fg-muted">{availableBalanceToken}</span>
					</div>

					<div className="space-y-3">
						<p className="text-2xs font-medium uppercase text-fg-muted">{ORDER_TEXT.SIZE_LABEL}</p>
						<div className="flex items-stretch gap-2">
							<NumberInput
								inputMode="decimal"
								inputSize="xl"
								placeholder="0.00"
								value={sizeInput}
								onChange={(e: ChangeEvent<HTMLInputElement>) => setSizeInput(e.target.value)}
								className="flex-1 tabular-nums font-semibold"
								disabled={isFormDisabled}
							/>
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								onClick={handleSizeModeToggle}
								disabled={isFormDisabled}
								iconRight={<CaretDownIcon className="size-3.5" />}
								className="shrink-0 self-stretch"
							>
								{sizeMode === "base" ? baseToken || "\u2014" : quoteToken || "\u2014"}
							</Button>
						</div>
						<div className="space-y-2">
							<Slider
								thumbSize="lg"
								value={[sliderValue]}
								onValueChange={(v) => {
									const val = Array.isArray(v) ? v[0] : v;
									setIsDraggingSlider(true);
									setDragSliderValue(val);
								}}
								onValueCommitted={(v) => {
									const val = Array.isArray(v) ? v[0] : v;
									setIsDraggingSlider(false);
									applySizeFromPercent(val);
								}}
								max={100}
								step={0.1}
								disabled={isFormDisabled || maxSize <= 0}
							/>
							<div className="flex items-center justify-between text-2xs text-fg-muted tabular-nums leading-none">
								{SIZE_PERCENT_OPTIONS.map((pct) => (
									<button
										key={pct}
										type="button"
										onClick={() => applySizeFromPercent(pct)}
										disabled={isFormDisabled || maxSize <= 0}
										className="hover:text-fg transition-colors disabled:cursor-not-allowed"
									>
										{pct}%
									</button>
								))}
							</div>
						</div>
					</div>

					{usesLimitPrice && (
						<PriceInput
							label={ORDER_TEXT.LIMIT_PRICE_LABEL}
							inputMode="decimal"
							inputSize="xl"
							placeholder="0.00"
							value={limitPriceInput}
							onChange={(e: ChangeEvent<HTMLInputElement>) => setLimitPriceInput(e.target.value)}
							onMidClick={setLimitPriceInput}
							midPrice={markPx}
							szDecimals={market?.szDecimals}
							className="tabular-nums font-semibold"
							disabled={isFormDisabled}
						/>
					)}

					{(capabilities.hasReduceOnly || (capabilities.hasTpSl && canUseTpSl)) && (
						<div className="flex items-center gap-4">
							{capabilities.hasReduceOnly && (
								<Checkbox
									checked={reduceOnly}
									onCheckedChange={(checked: boolean | "indeterminate") => setReduceOnly(checked === true)}
									disabled={isFormDisabled}
									label={ORDER_TEXT.REDUCE_ONLY_LABEL}
								/>
							)}
							{capabilities.hasTpSl && canUseTpSl && (
								<Checkbox
									checked={tpSlEnabled}
									onCheckedChange={(checked: boolean | "indeterminate") => setTpSlEnabled(checked === true)}
									disabled={isFormDisabled}
									label={ORDER_TEXT.TPSL_LABEL}
								/>
							)}
						</div>
					)}

					<div className="divide-y divide-stroke-weak/40 text-xs">
						{capabilities.isLeveraged && (
							<SummaryRow
								label={ORDER_TEXT.SUMMARY_LIQ}
								value={
									liqPrice ? formatPrice(liqPrice, { szDecimals: market?.szDecimals }) : FALLBACK_VALUE_PLACEHOLDER
								}
								valueClass="text-error"
							/>
						)}
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_ORDER_VALUE}
							value={orderValue > 0 ? formatUSD(orderValue) : FALLBACK_VALUE_PLACEHOLDER}
						/>
						{capabilities.isLeveraged && (
							<SummaryRow
								label={ORDER_TEXT.SUMMARY_MARGIN_REQ}
								value={marginRequired > 0 ? formatUSD(marginRequired) : FALLBACK_VALUE_PLACEHOLDER}
							/>
						)}
						<div className="flex items-center justify-between py-2.5">
							<span className="text-fg-muted">{ORDER_TEXT.SUMMARY_SLIPPAGE}</span>
							<button
								type="button"
								onClick={openSettingsDialog}
								className="inline-flex cursor-pointer items-center gap-1 hover:opacity-80"
							>
								<span className="tabular-nums text-error">{slippagePercent}%</span>
								<PencilIcon className="size-2.5 text-fg-muted" />
							</button>
						</div>
						<SummaryRow
							label={ORDER_TEXT.SUMMARY_FEE}
							value={orderValue > 0 ? `${feeRatePercent} (${formatUSD(estimatedFee)})` : feeRatePercent}
							valueClass="text-fg-muted"
						/>
					</div>
				</div>
			</div>

			<div className="shrink-0 px-3 py-3 border-t border-stroke-weak/40 bg-background">
				{validation.errors.length > 0 && isConnected && availableBalance > 0 && !validation.needsApproval && (
					<p className="text-xs text-error mb-2">{validation.errors.join(" \u2022 ")}</p>
				)}
				{approvalError && <p className="text-xs text-error mb-2">{approvalError}</p>}
				<Button
					variant="outline"
					size="lg"
					onClick={buttonContent.action}
					disabled={buttonContent.disabled}
					intent={buttonContent.variant === "cyan" ? "brand" : buttonContent.variant === "buy" ? "neutral" : "error"}
					className={cn(
						"w-full",
						buttonContent.variant === "cyan"
							? "bg-brand-soft border-stroke-brand-strong text-brand hover:bg-brand-soft/30"
							: buttonContent.variant === "buy"
								? "bg-success-soft border-stroke-success-strong text-success hover:bg-success-soft/30"
								: "bg-error-soft border-stroke-error-strong text-error hover:bg-error-soft/30",
					)}
					iconLeft={isSubmitting || isRegistering ? <SpinnerGapIcon className="size-5 animate-spin" /> : undefined}
				>
					{buttonContent.text}
				</Button>
				<MobileBottomNavSpacer />
			</div>

			<WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
			<OrderToast />
		</div>
	);
}

function SummaryRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
	return (
		<div className="flex items-center justify-between py-2.5">
			<span className="text-fg-muted">{label}</span>
			<span className={cn("tabular-nums", valueClass ?? "text-fg")}>{value}</span>
		</div>
	);
}

interface MobileButtonContentInput {
	isConnected: boolean;
	needsChainSwitch: boolean;
	isSwitchingChain: boolean;
	availableBalance: number;
	needsApproval: boolean;
	canSubmit: boolean;
	isRegistering: boolean;
	canApprove: boolean;
	isSubmitting: boolean;
	side: Side;
	sideLabel: string;
	onConnect: () => void;
	onSwitchChain: () => void;
	onDeposit: () => void;
	onApprove: () => void;
	onSubmit: () => void;
}

function getMobileOrderButtonContent(input: MobileButtonContentInput): ButtonContent {
	if (!input.isConnected) {
		return {
			text: ORDER_TEXT.BUTTON_CONNECT,
			action: input.onConnect,
			disabled: false,
			variant: "cyan",
		};
	}
	if (input.needsChainSwitch) {
		return {
			text: input.isSwitchingChain ? ORDER_TEXT.BUTTON_SWITCHING : ORDER_TEXT.BUTTON_SWITCH_CHAIN,
			action: input.onSwitchChain,
			disabled: input.isSwitchingChain,
			variant: "cyan",
		};
	}
	if (input.availableBalance <= 0) {
		return {
			text: ORDER_TEXT.BUTTON_DEPOSIT,
			action: input.onDeposit,
			disabled: false,
			variant: "cyan",
		};
	}
	if (input.needsApproval) {
		return {
			text: getApprovalButtonText(input.isRegistering, input.canApprove),
			action: input.onApprove,
			disabled: input.isRegistering || !input.canApprove,
			variant: "cyan",
		};
	}
	return {
		text: input.sideLabel,
		action: input.onSubmit,
		disabled: !input.canSubmit || input.isSubmitting,
		variant: input.side,
	};
}

function getApprovalButtonText(isRegistering: boolean, canApprove: boolean): string {
	if (isRegistering) return ORDER_TEXT.BUTTON_SIGNING;
	if (!canApprove) return ORDER_TEXT.BUTTON_LOADING;
	return ORDER_TEXT.BUTTON_ENABLE_TRADING;
}
