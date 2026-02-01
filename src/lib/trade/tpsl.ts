import { type Numeric, toBig, toSafeBig } from "./numbers";
import type { Side } from "./types";

export function calculateTpPrice(
	referencePrice: Numeric,
	side: Side,
	tpPercent: Numeric,
	decimals: number,
): string | null {
	const ref = toSafeBig(referencePrice);
	const pct = toSafeBig(tpPercent);
	if (ref.lte(0) || pct.lte(0)) return null;

	const percentValue = ref.times(pct).div(100);
	const price = side === "buy" ? ref.plus(percentValue) : ref.minus(percentValue);
	return price.toFixed(decimals);
}

export function calculateSlPrice(
	referencePrice: Numeric,
	side: Side,
	slPercent: Numeric,
	decimals: number,
): string | null {
	const ref = toSafeBig(referencePrice);
	const pct = toSafeBig(slPercent);
	if (ref.lte(0) || pct.lte(0)) return null;

	const percentValue = ref.times(pct).div(100);
	const price = side === "buy" ? ref.minus(percentValue) : ref.plus(percentValue);
	return price.toFixed(decimals);
}

export function calculatePercentFromPrice(
	referencePrice: Numeric,
	targetPrice: Numeric,
	side: Side,
	type: "tp" | "sl",
): number | null {
	const ref = toSafeBig(referencePrice);
	const target = toSafeBig(targetPrice);
	if (ref.lte(0) || target.lte(0)) return null;

	const percent = target.minus(ref).div(ref).times(100).toNumber();
	return type === "tp" ? (side === "buy" ? percent : -percent) : side === "buy" ? -percent : percent;
}

interface TpSlCalcParams {
	referencePrice: Numeric;
	side: Side;
	size: Numeric;
}

export function calculateEstimatedPnl(params: TpSlCalcParams, targetPrice: Numeric): number | null {
	const ref = toSafeBig(params.referencePrice);
	const target = toSafeBig(targetPrice);
	const sz = toSafeBig(params.size);
	if (ref.lte(0) || target.lte(0) || sz.lte(0)) return null;

	const pnl = target.minus(ref).times(sz).toNumber();
	return params.side === "buy" ? pnl : -pnl;
}

export function validateTpPrice(referencePrice: Numeric, tpPrice: Numeric, side: Side): boolean {
	const ref = toSafeBig(referencePrice);
	const tp = toSafeBig(tpPrice);
	if (ref.lte(0) || tp.lte(0)) return false;
	return side === "buy" ? tp.gt(ref) : tp.lt(ref);
}

export function validateSlPrice(referencePrice: Numeric, slPrice: Numeric, side: Side): boolean {
	const ref = toSafeBig(referencePrice);
	const sl = toSafeBig(slPrice);
	if (ref.lte(0) || sl.lte(0)) return false;
	return side === "buy" ? sl.lt(ref) : sl.gt(ref);
}

export function getTpSlValidationError(
	referencePrice: Numeric,
	tpPrice: Numeric,
	slPrice: Numeric,
	side: Side,
): string | null {
	if (toSafeBig(tpPrice).gt(0) && !validateTpPrice(referencePrice, tpPrice, side)) {
		return side === "buy" ? "TP must be above entry price" : "TP must be below entry price";
	}
	if (toSafeBig(slPrice).gt(0) && !validateSlPrice(referencePrice, slPrice, side)) {
		return side === "buy" ? "SL must be below entry price" : "SL must be above entry price";
	}
	return null;
}

export interface RiskRewardDisplay {
	risk: number;
	reward: number;
	label: string;
	isFavorable: boolean;
}

export function formatRiskRewardRatio(ratio: Numeric): RiskRewardDisplay | null {
	const ratioBig = toBig(ratio);
	if (!ratioBig || ratioBig.lte(0)) return null;

	const ratioNum = ratioBig.toNumber();
	const isFavorable = ratioNum >= 1;

	if (ratioNum >= 1) {
		const rounded = ratioBig.round(1).toNumber();
		const isWhole = rounded === Math.round(rounded);
		return {
			risk: 1,
			reward: rounded,
			label: `1:${isWhole ? Math.round(rounded) : rounded.toFixed(1)}`,
			isFavorable,
		};
	}

	const inverted = toSafeBig(1).div(ratioBig);
	const rounded = inverted.round(1).toNumber();
	const isWhole = rounded === Math.round(rounded);
	return {
		risk: rounded,
		reward: 1,
		label: `${isWhole ? Math.round(rounded) : rounded.toFixed(1)}:1`,
		isFavorable,
	};
}
