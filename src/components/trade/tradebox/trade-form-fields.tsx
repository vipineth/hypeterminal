import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
	reduceOnlyId,
	tpSlId,
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
			<div className="space-y-1 text-2xs">
				<div className="flex items-center justify-between text-text-950">
					<span className="text-text-500">{t`Available`}</span>
					<div className="flex items-center gap-2">
						<span className={cn("tabular-nums flex items-center gap-1", getValueColorClass(availableBalance))}>
							{formatAvailableBalance()} {availableBalanceToken}
						</span>
						{isConnected && swapTargetToken && (
							<Button variant="ghost" size="sm" className="h-7 rounded-md px-2 text-2xs" onClick={onSwapClick}>
								{t`Swap`}
							</Button>
						)}
						{isConnected && (
							<Button variant="ghost" size="sm" className="h-7 rounded-md px-2 text-2xs" onClick={onDepositClick}>
								{t`Deposit`}
							</Button>
						)}
					</div>
				</div>
				{!isSpotMarket && positionSize !== 0 && (
					<div className="flex items-center justify-between text-text-950">
						<span className="text-text-500">{t`Position`}</span>
						<span className={cn("tabular-nums", getValueColorClass(positionSize))}>
							{positionSize > 0 ? "+" : ""}
							{formatDecimalFloor(positionSize, szDecimals)} {baseToken}
						</span>
					</div>
				)}
			</div>

			<div className="space-y-1.5 border-t border-border-50 pt-3">
				<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Size`}</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleSizeModeToggle}
						className="h-9 rounded-xs border-border-100 bg-surface-execution px-2.5 text-2xs hover:bg-accent"
						aria-label={t`Toggle size mode`}
						disabled={isFormDisabled}
					>
						<span className="text-3xs">{sizeModeLabel}</span>
						<ArrowsLeftRightIcon className="size-2.5" />
					</Button>
					<NumberInput
						placeholder="0.00"
						value={sizeInput}
						onChange={(e) => handleSizeChange(e.target.value)}
						inputSize="lg"
						maxAllowedDecimals={szDecimals}
						className={cn(
							"flex-1 rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50",
							sizeHasError && "border-market-down-600 focus:border-market-down-600",
						)}
						disabled={isFormDisabled}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Slider
						thumbLabel="Order size percentage"
						thickness="lg"
						value={sliderValue}
						onValueChange={(nextValue) => {
							setIsDraggingSlider(true);
							setDragSliderValue(nextValue);
						}}
						onValueCommitted={(nextValue) => {
							setIsDraggingSlider(false);
							handleSizePercentApply(nextValue);
						}}
						max={100}
						step={0.1}
						className="flex-1 py-2"
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
							className="w-14 rounded-xs border-border-100 bg-surface-execution pr-5 text-right text-2xs tabular-nums shadow-none"
							disabled={isFormDisabled || maxSize <= 0}
						/>
						<span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-2xs text-text-600 pointer-events-none">
							%
						</span>
					</div>
				</div>
			</div>

			{usesTriggerPrice && (
				<div className="space-y-1.5">
					<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Trigger Price (USDC)`}</div>
					<NumberInput
						placeholder="0.00"
						value={triggerPriceInput}
						onChange={(e) => setTriggerPrice(e.target.value)}
						inputSize="lg"
						maxLabel={t`Mid`}
						onMaxClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						className={cn(
							"w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50",
							usesTriggerPrice &&
								!isPositive(triggerPriceNum) &&
								sizeValue > 0 &&
								"border-market-down-600 focus:border-market-down-600",
						)}
						disabled={isFormDisabled}
					/>
				</div>
			)}

			{usesLimitPrice && (
				<div className="space-y-1.5">
					<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Limit Price`}</div>
					<NumberInput
						placeholder="0.00"
						value={limitPriceInput}
						onChange={(e) => setLimitPrice(e.target.value)}
						inputSize="lg"
						maxLabel={t`Mid`}
						onMaxClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						className={cn(
							"w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50",
							usesLimitPrice && !price && sizeValue > 0 && "border-market-down-600 focus:border-market-down-600",
						)}
						disabled={isFormDisabled}
					/>
				</div>
			)}

			{showTif && (
				<div className="space-y-1.5">
					<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Time in Force`}</div>
					<Select value={tif} onValueChange={(value) => setTif(value as LimitTif)} disabled={isFormDisabled}>
						<SelectTrigger
							size="sm"
							className="w-full rounded-xs border-border-100 bg-surface-execution text-2xs shadow-none"
						>
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
						<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Start Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleStartPriceInput}
							onChange={(e) => setScaleStart(e.target.value)}
							inputSize="lg"
							className="w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50"
							disabled={isFormDisabled}
							maxLabel={t`Mid`}
							onMaxClick={() => setScaleStart(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`End Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleEndPriceInput}
							onChange={(e) => setScaleEnd(e.target.value)}
							inputSize="lg"
							className="w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50"
							disabled={isFormDisabled}
							maxLabel={t`Mid`}
							onMaxClick={() => setScaleEnd(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Number of Orders`}</div>
							<span className="text-3xs text-text-500">{`${SCALE_LEVELS_MIN}-${SCALE_LEVELS_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="4"
							value={String(scaleLevelsNum)}
							onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
							allowDecimals={false}
							inputSize="lg"
							className="w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50"
							disabled={isFormDisabled}
						/>
					</div>
				</>
			)}

			{twapOrder && (
				<>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-3xs font-medium uppercase tracking-[0.14em] text-text-500">{t`Duration (Minutes)`}</div>
							<span className="text-3xs text-text-500">{`${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="30"
							value={String(twapMinutesNum)}
							onChange={(e) => setTwapMinutes(Number(e.target.value) || 30)}
							allowDecimals={false}
							inputSize="lg"
							className="w-full rounded-xs border-border-100 bg-surface-execution tabular-nums shadow-none focus:border-primary-default/50"
							disabled={isFormDisabled}
						/>
					</div>
					<div className="flex items-center gap-2 text-2xs">
						<Checkbox
							checked={twapRandomize}
							onCheckedChange={(checked) => setTwapRandomize(checked === true)}
							disabled={isFormDisabled}
						/>
						<span className={cn(isFormDisabled && "text-text-600")}>{t`Randomize timing`}</span>
					</div>
				</>
			)}

			{(capabilities.hasReduceOnly || (capabilities.hasTpSl && canUseTpSl)) && (
				<div className="space-y-3 border-t border-border-50 pt-3">
					<div className="flex items-center gap-3 text-2xs">
						{capabilities.hasReduceOnly && (
							<div className="inline-flex items-center gap-2">
								<Checkbox
									id={reduceOnlyId}
									aria-label={t`Reduce Only`}
									checked={triggerOrder || reduceOnly}
									onCheckedChange={(checked) => setReduceOnly(checked === true)}
									disabled={isFormDisabled || triggerOrder}
								/>
								<label
									htmlFor={reduceOnlyId}
									className={cn(
										"cursor-pointer",
										(isFormDisabled || triggerOrder) && "cursor-not-allowed text-text-600",
									)}
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
									className={cn("cursor-pointer", isFormDisabled && "cursor-not-allowed text-text-600")}
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
