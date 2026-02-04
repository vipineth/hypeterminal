import { t } from "@lingui/core/macro";
import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
	FALLBACK_VALUE_PLACEHOLDER,
	ORDER_MIN_NOTIONAL_USD,
	ORDER_SIZE_PERCENT_STEPS,
	SCALE_LEVELS_MAX,
	SCALE_LEVELS_MIN,
	TWAP_MINUTES_MAX,
	TWAP_MINUTES_MIN,
} from "@/config/constants";
import { getSliderValue } from "@/domain/trade/order/size";
import { cn } from "@/lib/cn";
import { formatPrice, formatToken, szDecimalsToPriceDecimals } from "@/lib/format";
import { formatDecimalFloor, getValueColorClass, isPositive, toFixed, toNumber } from "@/lib/trade/numbers";
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
import type { Side } from "@/lib/trade/types";
import {
	useLimitPrice,
	useOrderEntryActions,
	useOrderSize,
	useOrderType,
	useReduceOnly,
	useScaleEnd,
	useScaleLevels,
	useScaleStart,
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
	isConnected: boolean;
	isFormDisabled: boolean;
	isSpotMarket: boolean;
	side: Side;
	price: number;
	markPx: number;
	maxSize: number;
	sizeValue: number;
	orderValue: number;
	szDecimals: number;
	availableBalance: number;
	availableBalanceToken: string;
	positionSize: number;
	baseToken: string | undefined;
	sizeModeLabel: string;
	swapTargetToken: string | null;
	capabilities: {
		hasReduceOnly: boolean;
		hasTpSl: boolean;
	};
	reduceOnlyId: string;
	tpSlId: string;
	onSizeModeToggle: () => void;
	onSizePercentApply: (pct: number) => void;
	onDepositClick: () => void;
	onSwapClick: () => void;
}

export function TradeFormFields({
	isConnected,
	isFormDisabled,
	isSpotMarket,
	side,
	price,
	markPx,
	maxSize,
	sizeValue,
	orderValue,
	szDecimals,
	availableBalance,
	availableBalanceToken,
	positionSize,
	baseToken,
	sizeModeLabel,
	swapTargetToken,
	capabilities,
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

	const orderType = useOrderType();
	const sizeInput = useOrderSize();
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
			<div className="space-y-0.5 text-3xs">
				<div className="flex items-center justify-between text-muted-fg">
					<span>{t`Available`}</span>
					<div className="flex items-center gap-2">
						<span className={cn("tabular-nums flex items-center gap-1", getValueColorClass(availableBalance))}>
							{formatAvailableBalance()} {availableBalanceToken}
						</span>
						{isConnected && swapTargetToken && (
							<Button variant="link" size="none" onClick={onSwapClick} className="text-info text-4xs uppercase">
								{t`Swap`}
							</Button>
						)}
						{isConnected && (
							<Button variant="link" size="none" onClick={onDepositClick} className="text-info text-4xs uppercase">
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
						<ArrowsLeftRight className="size-2.5" />
					</Button>
					<NumberInput
						placeholder="0.00"
						value={sizeInput}
						onChange={(e) => handleSizeChange(e.target.value)}
						maxAllowedDecimals={szDecimals}
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
						handleSizePercentApply(v[0]);
					}}
					max={100}
					step={0.1}
					className="py-5"
					disabled={isFormDisabled || maxSize <= 0}
				/>

				<div className="grid grid-cols-4 gap-1">
					{ORDER_SIZE_PERCENT_STEPS.map((p) => (
						<Button
							key={p}
							onClick={() => handleSizePercentApply(p)}
							variant="outline"
							size="xs"
							aria-label={t`Set ${p}%`}
						>
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
								onClick={() => setTriggerPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
								className="text-4xs text-muted-fg hover:text-info hover:bg-transparent tabular-nums"
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
								onClick={() => setLimitPrice(toFixed(markPx, szDecimalsToPriceDecimals(szDecimals)))}
								className="text-4xs text-muted-fg hover:text-info hover:bg-transparent tabular-nums"
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
									checked={triggerOrder || reduceOnly}
									onCheckedChange={(checked) => setReduceOnly(checked === true)}
									disabled={isFormDisabled || triggerOrder}
								/>
								<label
									htmlFor={reduceOnlyId}
									className={cn(
										"cursor-pointer",
										(isFormDisabled || triggerOrder) && "cursor-not-allowed text-muted-fg",
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
