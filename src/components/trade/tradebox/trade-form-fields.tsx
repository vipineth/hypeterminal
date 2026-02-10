import { t } from "@lingui/core/macro";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider, type SliderMark } from "@/components/ui/slider";
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
import { formatPrice, formatToken, szDecimalsToPriceDecimals } from "@/lib/format";
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

	const sizeMarks: SliderMark[] = [{ value: 0 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }];

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
			<div className="space-y-0.5 text-3xs">
				<div className="flex items-center justify-between text-text-950">
					<span>{t`Available`}</span>
					<div className="flex items-center gap-2">
						<span className={cn("tabular-nums flex items-center gap-1", getValueColorClass(availableBalance))}>
							{formatAvailableBalance()} {availableBalanceToken}
						</span>
						{isConnected && swapTargetToken && (
							<Button variant="text" size="sm" onClick={onSwapClick}>
								{t`Swap`}
							</Button>
						)}
						{isConnected && (
							<Button variant="text" size="sm" onClick={onDepositClick}>
								{t`Deposit`}
							</Button>
						)}
					</div>
				</div>
				{!isSpotMarket && positionSize !== 0 && (
					<div className="flex items-center justify-between text-text-950">
						<span>{t`Position`}</span>
						<span className={cn("tabular-nums", getValueColorClass(positionSize))}>
							{positionSize > 0 ? "+" : ""}
							{formatDecimalFloor(positionSize, szDecimals)} {baseToken}
						</span>
					</div>
				)}
			</div>

			<div className="space-y-1.5">
				<div className="text-4xs uppercase tracking-wider text-text-950">{t`Size`}</div>
				<div className="flex items-center gap-1">
					<Button
						variant="text"
						onClick={handleSizeModeToggle}
						className="px-2 py-1.5 text-3xs border border-border-200/60 hover:border-text-400 hover:bg-transparent gap-1"
						aria-label={t`Toggle size mode`}
						disabled={isFormDisabled}
					>
						<span className="text-4xs">{sizeModeLabel}</span>
						<ArrowsLeftRightIcon className="size-2.5" />
					</Button>
					<NumberInput
						placeholder="0.00"
						value={sizeInput}
						onChange={(e) => handleSizeChange(e.target.value)}
						maxAllowedDecimals={szDecimals}
						className={cn(
							"flex-1 text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums",
							sizeHasError && "border-market-down-600 focus:border-market-down-600",
						)}
						disabled={isFormDisabled}
					/>
				</div>

				<div className="flex items-center gap-2">
					<Slider
						value={[sliderValue]}
						onValueChange={(v) => {
							setIsDraggingSlider(true);
							setDragSliderValue(v[0]);
						}}
						onValueCommit={(v) => {
							setIsDraggingSlider(false);
							handleSizePercentApply(v[0]);
						}}
						max={100}
						step={0.1}
						marks={sizeMarks}
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
							className="w-14 text-2xs text-right pr-5 bg-surface-base/50 border-border-200/60 tabular-nums"
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
					<div className="flex items-center justify-between">
						<div className="text-4xs uppercase tracking-wider text-text-950">{t`Trigger Price (USDC)`}</div>
						{markPx > 0 && (
							<Button
								variant="text"
								onClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
								className="text-4xs text-text-950 hover:text-primary-default hover:bg-transparent tabular-nums"
							>
								{t`Mark`}: {formatPrice(markPx, { szDecimals })}
							</Button>
						)}
					</div>
					<NumberInput
						placeholder="0.00"
						value={triggerPriceInput}
						onChange={(e) => setTriggerPrice(e.target.value)}
						className={cn(
							"w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums",
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
					<div className="flex items-center justify-between">
						<div className="text-4xs uppercase tracking-wider text-text-950">{t`Limit Price`}</div>
						{markPx > 0 && (
							<Button
								variant="text"
								onClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
								className="text-4xs text-text-950 hover:text-primary-default hover:bg-transparent tabular-nums"
							>
								{t`Mark`}: {formatPrice(markPx, { szDecimals })}
							</Button>
						)}
					</div>
					<NumberInput
						placeholder="0.00"
						value={limitPriceInput}
						onChange={(e) => setLimitPrice(e.target.value)}
						className={cn(
							"w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums",
							usesLimitPrice && !price && sizeValue > 0 && "border-market-down-600 focus:border-market-down-600",
						)}
						disabled={isFormDisabled}
					/>
				</div>
			)}

			{showTif && (
				<div className="space-y-1.5">
					<div className="text-4xs uppercase tracking-wider text-text-950">{t`Time in Force`}</div>
					<Select value={tif} onValueChange={(value) => setTif(value as LimitTif)} disabled={isFormDisabled}>
						<SelectTrigger size="sm" className="w-full text-2xs bg-surface-base/50 border-border-200/60">
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
						<div className="text-4xs uppercase tracking-wider text-text-950">{t`Start Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleStartPriceInput}
							onChange={(e) => setScaleStart(e.target.value)}
							className="w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="text-4xs uppercase tracking-wider text-text-950">{t`End Price (USDC)`}</div>
						<NumberInput
							placeholder="0.00"
							value={scaleEndPriceInput}
							onChange={(e) => setScaleEnd(e.target.value)}
							className="w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-text-950">{t`Number of Orders`}</div>
							<span className="text-4xs text-text-950">{`${SCALE_LEVELS_MIN}-${SCALE_LEVELS_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="4"
							value={String(scaleLevelsNum)}
							onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
							allowDecimals={false}
							className="w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
				</>
			)}

			{twapOrder && (
				<>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<div className="text-4xs uppercase tracking-wider text-text-950">{t`Duration (Minutes)`}</div>
							<span className="text-4xs text-text-950">{`${TWAP_MINUTES_MIN}-${TWAP_MINUTES_MAX}`}</span>
						</div>
						<NumberInput
							placeholder="30"
							value={String(twapMinutesNum)}
							onChange={(e) => setTwapMinutes(Number(e.target.value) || 30)}
							allowDecimals={false}
							className="w-full text-2xs bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums"
							disabled={isFormDisabled}
						/>
					</div>
					<div className="flex items-center gap-2 text-3xs">
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
				<div className="space-y-4">
					<div className="flex items-center gap-3 text-3xs">
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
