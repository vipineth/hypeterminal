import { t } from "@lingui/core/macro";
import { NumberInput } from "@/components/ui/number-input";
import { PriceInput } from "@/components/ui/price-input";
import { SCALE_LEVELS_MAX, SCALE_LEVELS_MIN } from "@/config/trade";
import { useOrderEntryActions, useScaleEnd, useScaleLevels, useScaleStart } from "@/stores/use-order-entry-store";

interface Props {
	markPx: number;
	priceDecimals: number | undefined;
	disabled: boolean;
}

export function TradeFormScale({ markPx, priceDecimals, disabled }: Props) {
	const scaleStartPriceInput = useScaleStart();
	const scaleEndPriceInput = useScaleEnd();
	const scaleLevelsNum = useScaleLevels();
	const { setScaleStart, setScaleEnd, setScaleLevels } = useOrderEntryActions();

	return (
		<>
			<PriceInput
				label={t`Start Price`}
				placeholder="0.00"
				value={scaleStartPriceInput}
				onChange={(e) => setScaleStart(e.target.value)}
				onMidClick={setScaleStart}
				midPrice={markPx}
				priceDecimals={priceDecimals}
				className="w-full text-xs tabular-nums"
				disabled={disabled}
			/>
			<PriceInput
				label={t`End Price`}
				placeholder="0.00"
				value={scaleEndPriceInput}
				onChange={(e) => setScaleEnd(e.target.value)}
				onMidClick={setScaleEnd}
				midPrice={markPx}
				priceDecimals={priceDecimals}
				className="w-full text-xs tabular-nums"
				disabled={disabled}
			/>
			<NumberInput
				label={t`Number of Orders`}
				labelValue={`${SCALE_LEVELS_MIN}–${SCALE_LEVELS_MAX}`}
				placeholder="4"
				value={String(scaleLevelsNum)}
				onChange={(e) => setScaleLevels(Number(e.target.value) || 4)}
				allowDecimals={false}
				className="w-full text-xs tabular-nums"
				disabled={disabled}
			/>
		</>
	);
}
