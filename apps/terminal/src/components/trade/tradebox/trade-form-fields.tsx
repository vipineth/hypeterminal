import { Button, Checkbox, Select, Slider } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { NumberInput } from "@/components/ui/number-input";
import {
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_MIN_NOTIONAL_USD,
	SCALE_LEVELS_MAX,
	SCALE_LEVELS_MIN,
	TWAP_MINUTES_MAX,
	TWAP_MINUTES_MIN,
} from "@/config/constants";
import { getSliderValue } from "@/domain/trade/order/size";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { cn } from "@/lib/cn";
import { formatToken, szDecimalsToPriceDecimals } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import {
	formatDecimalFloor,
	getValueColorClass,
	isPositive,
	toFixed,
	toNumber,
	toNumberOrZero,
} from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isScaleOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	type LimitTif,
	TIF_OPTIONS,
	usesLimitPrice as usesLimitPriceForOrder,
	usesTriggerPrice as usesTriggerPriceForOrder,
} from "@/lib/trade/order-types";
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
import { TpSlSection } from "./tp-sl-section";

interface Props {
	price: number;
	positionSize: number;
	swapTargetToken: string | null;
	reduceOnlyId: string;
	tpSlId: string;
	onSizeModeToggle: () => void;
	onSizePercentApply: (pct: number) => void;
	onDepositClick: () => void;
	onSwapClick: () => void;
}

export function TradeFormFields({
	price,
	positionSize,
	swapTargetToken,
	reduceOnlyId: _reduceOnlyId,
	tpSlId: _tpSlId,
	onSizeModeToggle,
	onSizePercentApply,
	onDepositClick,
	onSwapClick,
}: Props) {
	const [isDraggingSlider, setIsDraggingSlider] = useState(false);
	const [dragSliderValue, setDragSliderValue] = useState(25);
	const [hasUserSized, setHasUserSized] = useState(false);

	const { isConnected } = useConnection();
	const { data: market } = useSelectedMarketInfo();

	const side = useOrderSide();
	const sizeMode = useSizeMode();
	const sizeInput = useOrderSize();
	const orderType = useOrderType();
	const limitPriceInput = useLimitPrice();
	const triggerPriceInput = useTriggerPrice();
	const scaleStartPriceInput = useScaleStart();
	const scaleEndPriceInput = useScaleEnd();
	const scaleLevelsNum = useScaleLevels();
	const twapMinutesNum = useTwapMinutes();
	const twapRandomize = useTwapRandomize();
	const tif = useTif();
	const reduceOnly = useReduceOnly();
	const tpSlEnabled = useTpSlEnabled();
	const tpPriceInput = useTpPrice();
	const slPriceInput = useSlPrice();

	const markPx = toNumberOrZero(market?.markPx);

	const {
		isSpotMarket,
		baseToken,
		capabilities,
		availableBalance,
		availableBalanceToken,
		maxSize,
		sizeValue,
		orderValue,
		sizeModeLabel,
		szDecimals,
	} = useOrderEntryData({ market, side, markPx, sizeMode, sizeInput });

	const {
		setSize,
		setLimitPrice,
		setTriggerPrice,
		setScaleStart,
		setScaleEnd,
		setScaleLevels,
		setTwapMinutes,
		setTwapRandomize,
		setTif,
		setReduceOnly,
		setTpSlEnabled,
		setTpPrice,
		setSlPrice,
	} = useOrderEntryActions();

	const isFormDisabled = !isConnected || availableBalance <= 0;

	const triggerOrder = isTriggerOrderType(orderType);
	const twapOrder = isTwapOrderType(orderType);
	const scaleOrder = isScaleOrderType(orderType);
	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const usesTriggerPrice = usesTriggerPriceForOrder(orderType);
	const canUseTpSl = canUseTpSlForOrder(orderType);
	const showTif = orderType === "limit" || orderType === "scale";
	const availableTifOptions = orderType === "limit" ? (["Gtc", "Ioc", "Alo"] as const) : (["Gtc", "Alo"] as const);

	const triggerPriceNum = toNumber(triggerPriceInput);
	const sizeHasError = (sizeValue > maxSize && maxSize > 0) || (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD);

	const sliderValue = (() => {
		if (isDraggingSlider) return dragSliderValue;
		if (!hasUserSized || sizeValue <= 0) return 25;
		return getSliderValue(sizeValue, maxSize);
	})();

	function handleSizeChange(value: string) {
		setHasUserSized(true);
		setSize(value);
	}

	function handleSizePercentApply(pct: number) {
		if (maxSize <= 0) return;
		setHasUserSized(true);
		onSizePercentApply(pct);
	}

	function handleSizeModeToggle() {
		setHasUserSized(true);
		onSizeModeToggle();
	}

	function formatAvailableBalance(): string {
		if (!isConnected) return FALLBACK_VALUE_PLACEHOLDER;
		const isBaseToken = isSpotMarket && side === "sell";
		const decimals = isBaseToken ? szDecimals : 2;
		return formatToken(availableBalance, decimals);
	}

	return (
		<>
			<div className="space-y-0.5 text-xs">
				<div className="flex items-center justify-between text-text-strong">
					<span>{t`Available`}</span>
					<div className="flex items-center gap-2">
						<span className={cn("tabular-nums flex items-center gap-1", getValueColorClass(availableBalance))}>
							{formatAvailableBalance()} {availableBalanceToken}
						</span>
						{isConnected && swapTargetToken && (
							<Button variant="link" intent="brand" size="sm" onClick={onSwapClick}>
								{t`Swap`}
							</Button>
						)}
						{isConnected && (
							<Button variant="link" intent="brand" size="sm" onClick={onDepositClick}>
								{t`Deposit`}
							</Button>
						)}
					</div>
				</div>
				{!isSpotMarket && positionSize !== 0 && (
					<div className="flex items-center justify-between text-text-strong">
						<span>{t`Position`}</span>
						<span className={cn("tabular-nums", getValueColorClass(positionSize))}>
							{positionSize > 0 ? "+" : ""}
							{formatDecimalFloor(positionSize, szDecimals)} {baseToken}
						</span>
					</div>
				)}
			</div>

			<div className="space-y-1.5">
				<div className="text-xs uppercase tracking-wider text-text-strong">{t`Size`}</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						intent="neutral"
						size="sm"
						onClick={handleSizeModeToggle}
						className="px-2 py-1.5 text-xs border border-stroke-weak/60 gap-1"
						aria-label={t`Toggle size mode`}
						disabled={isFormDisabled}
						iconRight={<ArrowsLeftRightIcon className="size-2.5" />}
					>
						<span className="text-xs">{sizeModeLabel}</span>
					</Button>
					<NumberInput
						placeholder="0.00"
						value={sizeInput}
						onChange={(e) => handleSizeChange(e.target.value)}
						maxAllowedDecimals={szDecimals}
						className={cn(
							"flex-1 text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums",
							sizeHasError && "border-stroke-error-strong focus:border-stroke-error-strong",
						)}
						disabled={isFormDisabled}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Slider
						value={[sliderValue]}
						onValueChange={(v) => {
							const val = Array.isArray(v) ? v[0] : v;
							setIsDraggingSlider(true);
							setDragSliderValue(val);
						}}
						onValueCommitted={(v) => {
							const val = Array.isArray(v) ? v[0] : v;
							setIsDraggingSlider(false);
							handleSizePercentApply(val);
						}}
						max={100}
						step={0.1}
						className="flex-1 py-5"
						disabled={isFormDisabled || maxSize <= 0}
					/>
					<div className="relative">
						<NumberInput
							value={String(Math.round(sliderValue))}
							onChange={(e) => {
								const pct = Number(e.target.value);
								if (pct >= 0 && pct <= 100) handleSizePercentApply(pct);
							}}
							allowDecimals={false}
							inputSize="sm"
							className="w-14 text-xs text-right pr-5 bg-bg-sunken/50 border-stroke-weak/60 tabular-nums"
							disabled={isFormDisabled || maxSize <= 0}
						/>
						<span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-text-weak pointer-events-none">
							%
						</span>
					</div>
				</div>
			</div>

			{usesTriggerPrice && (
				<div className="space-y-1.5">
					<div className="text-xs uppercase tracking-wider text-text-strong">{t`Trigger Price (USDC)`}</div>
					<NumberInput
						placeholder="0.00"
						value={triggerPriceInput}
						onChange={(e) => setTriggerPrice(e.target.value)}
						maxLabel={t`Mid`}
						onMaxClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						className={cn(
							"w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums",
							usesTriggerPrice &&
								!isPositive(triggerPriceNum) &&
								sizeValue > 0 &&
								"border-stroke-error-strong focus:border-stroke-error-strong",
						)}
						disabled={isFormDisabled}
					/>
				</div>
			)}

			{usesLimitPrice && (
				<div className="space-y-1.5">
					<div className="text-xs uppercase tracking-wider text-text-strong">{t`Limit Price`}</div>
					<NumberInput
						placeholder="0.00"
						value={limitPriceInput}
						onChange={(e) => setLimitPrice(e.target.value)}
						maxLabel={t`Mid`}
						onMaxClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						className={cn(
							"w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums",
							usesLimitPrice &&
								!price &&
								sizeValue > 0 &&
								"border-stroke-error-strong focus:border-stroke-error-strong",
						)}
						disabled={isFormDisabled}
					/>
				</div>
			)}

			{showTif && (
				<div className="space-y-1.5">
					<div className="text-xs uppercase tracking-wider text-text-strong">{t`Time in Force`}</div>
					<Select
						value={tif}
						onValueChange={(value) => setTif(value as LimitTif)}
						disabled={isFormDisabled}
						options={availableTifOptions.map((option) => ({
							value: option,
							label: TIF_OPTIONS[option].label,
						}))}
						className="w-full"
					/>
				</div>
			)}

			{scaleOrder && (
				<>
					<div className="space-y-1.5">
						<div className="text-xs uppercase tracking-wider text-text-strong">{t`Start Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleStartPriceInput}
							onChange={(e) => setScaleStart(e.target.value)}
							className="w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums"
							disabled={isFormDisabled}
							maxLabel={t`Mid`}
							onMaxClick={() => setScaleStart(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="text-xs uppercase tracking-wider text-text-strong">{t`End Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleEndPriceInput}
							onChange={(e) => setScaleEnd(e.target.value)}
							className="w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums"
							disabled={isFormDisabled}
							maxLabel={t`Mid`}
							onMaxClick={() => setScaleEnd(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-xs uppercase tracking-wider text-text-strong">{t`Number of Orders`}</div>
							<span className="text-xs text-text-strong">{`${SCALE_LEVELS_MIN}-${SCALE_LEVELS_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="4"
							value={String(scaleLevelsNum)}
							onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
							allowDecimals={false}
							className="w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
				</>
			)}

			{twapOrder && (
				<>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-xs uppercase tracking-wider text-text-strong">{t`Duration (Minutes)`}</div>
							<span className="text-xs text-text-strong">{`${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="30"
							value={String(twapMinutesNum)}
							onChange={(e) => setTwapMinutes(Number(e.target.value) || 30)}
							allowDecimals={false}
							className="w-full text-xs bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
					<div className="flex items-center text-xs">
						<Checkbox
							checked={twapRandomize}
							onCheckedChange={(checked) => setTwapRandomize(checked === true)}
							disabled={isFormDisabled}
							label={t`Randomize timing`}
						/>
					</div>
				</>
			)}

			{(capabilities.hasReduceOnly || (capabilities.hasTpSl && canUseTpSl)) && (
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-xs">
						{capabilities.hasReduceOnly && (
							<Checkbox
								aria-label={t`Reduce Only`}
								checked={triggerOrder || reduceOnly}
								onCheckedChange={(checked) => setReduceOnly(checked === true)}
								disabled={isFormDisabled || triggerOrder}
								label={t`Reduce Only`}
							/>
						)}
						{capabilities.hasTpSl && canUseTpSl && (
							<Checkbox
								aria-label={t`Take Profit / Stop Loss`}
								checked={tpSlEnabled}
								onCheckedChange={(checked) => setTpSlEnabled(checked === true)}
								disabled={isFormDisabled}
								label={t`TP/SL`}
							/>
						)}
					</div>

					{capabilities.hasTpSl && tpSlEnabled && canUseTpSl && (
						<TpSlSection
							side={side}
							referencePrice={price}
							size={sizeValue}
							szDecimals={szDecimals}
							tpPrice={tpPriceInput}
							slPrice={slPriceInput}
							onTpPriceChange={setTpPrice}
							onSlPriceChange={setSlPrice}
							disabled={isFormDisabled}
						/>
					)}
				</div>
			)}
		</>
	);
}
