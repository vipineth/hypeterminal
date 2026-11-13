import { Button, Checkbox, Slider, Tooltip } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useId, useState } from "react";
import { useConnection } from "wagmi";
import { labelTypographyClass } from "@/components/ui/field-label";
import { NumberInput } from "@/components/ui/number-input";
import { PriceInput } from "@/components/ui/price-input";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { ORDER_MIN_NOTIONAL_USD, SIZE_PERCENT_OPTIONS } from "@/config/trade";
import { getSliderValue } from "@/domain/trade/order/size";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { cn } from "@/lib/cn";
import { formatToken } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { isPositive, toNumber, toNumberOrZero, truncateDecimals } from "@/lib/trade/numbers";
import {
	canUseTpSl as canUseTpSlForOrder,
	isScaleOrderType,
	isTriggerOrderType,
	isTwapOrderType,
	usesLimitPrice as usesLimitPriceForOrder,
	usesTriggerPrice as usesTriggerPriceForOrder,
} from "@/lib/trade/order-types";
import { getValueColorClass } from "@/lib/ui/value-color";
import {
	useLimitPrice,
	useOrderEntryActions,
	useOrderSide,
	useOrderSize,
	useOrderType,
	useReduceOnly,
	useSizeMode,
	useTpSlEnabled,
	useTriggerPrice,
} from "@/stores/use-order-entry-store";
import { TradeFormScale } from "./trade-form-scale";
import { TradeFormTif } from "./trade-form-tif";
import { TradeFormTpSl } from "./trade-form-tp-sl";
import { TradeFormTwap } from "./trade-form-twap";

interface Props {
	price: number;
	positionSize: number;
	swapTargetToken: string | null;
	onSizeModeToggle: () => void;
	onSizePercentApply: (pct: number) => void;
	onDepositClick: () => void;
	onSwapClick: () => void;
}

export function TradeFormFields({
	price,
	positionSize,
	swapTargetToken,
	onSizeModeToggle,
	onSizePercentApply,
	onDepositClick,
	onSwapClick,
}: Props) {
	const sizeFieldId = useId();
	const [isDraggingSlider, setIsDraggingSlider] = useState(false);
	const [dragSliderValue, setDragSliderValue] = useState(0);

	const { isConnected } = useConnection();
	const { data: market } = useSelectedMarketInfo();

	const side = useOrderSide();
	const sizeMode = useSizeMode();
	const sizeInput = useOrderSize();
	const orderType = useOrderType();
	const limitPriceInput = useLimitPrice();
	const triggerPriceInput = useTriggerPrice();
	const reduceOnly = useReduceOnly();
	const tpSlEnabled = useTpSlEnabled();

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

	const { setSize, setLimitPrice, setTriggerPrice, setReduceOnly, setTpSlEnabled } = useOrderEntryActions();

	const isFormDisabled = !isConnected || availableBalance <= 0;

	const triggerOrder = isTriggerOrderType(orderType);
	const twapOrder = isTwapOrderType(orderType);
	const scaleOrder = isScaleOrderType(orderType);
	const usesLimitPrice = usesLimitPriceForOrder(orderType);
	const usesTriggerPrice = usesTriggerPriceForOrder(orderType);
	const canUseTpSl = canUseTpSlForOrder(orderType);
	const showTif = orderType === "limit" || orderType === "scale";

	const triggerPriceNum = toNumber(triggerPriceInput);
	const sizeHasError = (sizeValue > maxSize && maxSize > 0) || (orderValue > 0 && orderValue < ORDER_MIN_NOTIONAL_USD);

	const sliderValue = isDraggingSlider ? dragSliderValue : getSliderValue(sizeValue, maxSize);

	function handleSizePercentApply(pct: number) {
		if (maxSize <= 0) return;
		onSizePercentApply(pct);
	}

	function formatAvailableBalance(): string {
		if (!isConnected) return FALLBACK_VALUE_PLACEHOLDER;
		const isBaseToken = isSpotMarket && side === "sell";
		const decimals = isBaseToken ? szDecimals : 2;
		return formatToken(availableBalance, { decimals, symbol: availableBalanceToken ?? undefined });
	}

	return (
		<div className="flex min-w-0 flex-col gap-5">
			<div className="flex min-w-0 flex-col gap-3">
				<div className="flex min-w-0 flex-col gap-2">
					<div className="flex min-w-0 items-baseline justify-between gap-2">
						<div className="inline-flex justify-between w-full min-w-0 items-baseline gap-x-1.5 text-3xs leading-snug">
							<Tooltip content={t`Balance available to trade`} side="top">
								<span className="font-medium uppercase tracking-wider text-fg-muted cursor-default">{t`Available`}</span>
							</Tooltip>
							<span>
								{isConnected ? (
									<span className={cn("tabular-nums", getValueColorClass(availableBalance))}>
										{formatAvailableBalance()}
									</span>
								) : null}
							</span>
						</div>
						<div className="flex shrink-0 items-center">
							{isConnected && swapTargetToken ? (
								<Button variant="link" intent="brand" size="xxs" onClick={onSwapClick}>
									{t`Swap`}
								</Button>
							) : null}
							{isConnected && availableBalance <= 0 ? (
								<Button variant="link" intent="brand" size="xxs" onClick={onDepositClick}>
									{t`Deposit`}
								</Button>
							) : null}
						</div>
					</div>
					{!isSpotMarket && positionSize !== 0 ? (
						<div className="flex min-w-0 items-baseline justify-between gap-2 text-3xs leading-snug">
							<Tooltip content={t`Your current open position on this market`} side="top">
								<span className="font-medium uppercase tracking-wider text-fg-muted cursor-default">{t`Position`}</span>
							</Tooltip>
							<span className={cn("tabular-nums", getValueColorClass(positionSize))}>
								{positionSize > 0 ? "+" : ""}
								{truncateDecimals(positionSize, szDecimals)} {baseToken}
							</span>
						</div>
					) : null}
				</div>

				{usesTriggerPrice && (
					<div className="border-t border-stroke-weak pt-3">
						<PriceInput
							label={t`Trigger Price`}
							placeholder="0.00"
							value={triggerPriceInput}
							onChange={(e) => setTriggerPrice(e.target.value)}
							onMidClick={setTriggerPrice}
							midPrice={markPx}
							szDecimals={szDecimals}
							className={cn(
								"w-full text-xs tabular-nums",
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
					<div className="border-t border-stroke-weak pt-3">
						<PriceInput
							label={t`Limit Price`}
							placeholder="0.00"
							value={limitPriceInput}
							onChange={(e) => setLimitPrice(e.target.value)}
							onMidClick={setLimitPrice}
							midPrice={markPx}
							szDecimals={szDecimals}
							className={cn(
								"w-full text-xs tabular-nums",
								usesLimitPrice &&
									!price &&
									sizeValue > 0 &&
									"border-stroke-error-strong focus:border-stroke-error-strong",
							)}
							disabled={isFormDisabled}
						/>
					</div>
				)}

				<div className="flex flex-col gap-0.5 border-t border-stroke-weak pt-3">
					<div className="mb-1 flex items-center justify-between gap-2">
						<label htmlFor={sizeFieldId} className={labelTypographyClass}>
							{t`Size`}
						</label>
						{sizeValue > 0 ? (
							<span className="text-3xs text-fg-muted tabular-nums leading-none">
								≈{" "}
								{sizeMode === "base"
									? `${formatToken(orderValue, 2)} USD`
									: `${truncateDecimals(sizeValue, szDecimals)} ${baseToken}`}
							</span>
						) : null}
					</div>
					<div className="mb-2.5 flex items-center gap-1">
						<NumberInput
							id={sizeFieldId}
							placeholder="0.00"
							value={sizeInput}
							onChange={(e) => setSize(e.target.value)}
							maxAllowedDecimals={szDecimals}
							className={cn(
								"flex-1 text-xs tabular-nums",
								sizeHasError && "border-stroke-error-strong focus:border-stroke-error-strong",
							)}
							disabled={isFormDisabled}
						/>
						<Button
							variant="outline"
							intent="neutral"
							size="sm"
							onClick={onSizeModeToggle}
							aria-label={t`Toggle size mode`}
							disabled={isFormDisabled}
							iconRight={<CaretDownIcon className="size-2.5" />}
						>
							{sizeModeLabel}
						</Button>
					</div>
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
						disabled={isFormDisabled || maxSize <= 0}
					/>
					<div className="flex items-center justify-between pt-1 text-3xs text-fg-muted tabular-nums leading-none">
						{SIZE_PERCENT_OPTIONS.map((pct) => (
							<button
								key={pct}
								type="button"
								onClick={() => handleSizePercentApply(pct)}
								disabled={isFormDisabled || maxSize <= 0}
								className="hover:text-fg transition-colors disabled:cursor-not-allowed"
							>
								{pct}%
							</button>
						))}
					</div>
				</div>
			</div>

			{scaleOrder && <TradeFormScale markPx={markPx} szDecimals={szDecimals} disabled={isFormDisabled} />}

			{twapOrder && <TradeFormTwap disabled={isFormDisabled} />}

			{(capabilities.hasReduceOnly || (capabilities.hasTpSl && canUseTpSl) || showTif) && (
				<div className="space-y-3.5 py-0.5">
					<div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-xs">
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
						{showTif && <TradeFormTif orderType={orderType} disabled={isFormDisabled} />}
					</div>

					{capabilities.hasTpSl && canUseTpSl && tpSlEnabled && (
						<TradeFormTpSl referencePrice={price} size={sizeValue} szDecimals={szDecimals} disabled={isFormDisabled} />
					)}
				</div>
			)}
		</div>
	);
}
