import { calc, isPositive, toBig, toNumber } from "./numbers";

type Side = "buy" | "sell";

interface TpSlCalcParams {
	referencePrice: unknown;
	side: Side;
	size: unknown;
}

export function calculateTpPrice(referencePrice: unknown, side: Side, tpPercent: unknown): number | null {
	if (!isPositive(referencePrice) || !isPositive(tpPercent)) {
		return null;
	}
	const percentValue = calc.percent(referencePrice, tpPercent);
	if (percentValue === null) return null;

	return side === "buy" ? calc.add(referencePrice, percentValue) : calc.subtract(referencePrice, percentValue);
}

export function calculateSlPrice(referencePrice: unknown, side: Side, slPercent: unknown): number | null {
	if (!isPositive(referencePrice) || !isPositive(slPercent)) {
		return null;
	}
	const percentValue = calc.percent(referencePrice, slPercent);
	if (percentValue === null) return null;

	return side === "buy" ? calc.subtract(referencePrice, percentValue) : calc.add(referencePrice, percentValue);
}

export function calculatePercentFromPrice(
	referencePrice: unknown,
	targetPrice: unknown,
	side: Side,
	type: "tp" | "sl",
): number | null {
	if (!isPositive(referencePrice) || !isPositive(targetPrice)) {
		return null;
	}
	const percent = calc.percentChange(referencePrice, targetPrice);
	if (percent === null) return null;

	if (type === "tp") {
		return side === "buy" ? percent : calc.multiply(percent, -1);
	}
	return side === "buy" ? calc.multiply(percent, -1) : percent;
}

export function calculateEstimatedPnl(params: TpSlCalcParams, targetPrice: unknown): number | null {
	if (!isPositive(params.referencePrice) || !isPositive(targetPrice) || !isPositive(params.size)) {
		return null;
	}
	const priceDiff = calc.subtract(targetPrice, params.referencePrice);
	if (priceDiff === null) return null;

	const pnl = calc.multiply(priceDiff, params.size);
	if (pnl === null) return null;

	return params.side === "buy" ? pnl : calc.multiply(pnl, -1);
}

export function validateTpPrice(referencePrice: unknown, tpPrice: unknown, side: Side): boolean {
	const refNum = toNumber(referencePrice);
	const tpNum = toNumber(tpPrice);
	if (!isPositive(refNum) || !isPositive(tpNum)) {
		return false;
	}
	return side === "buy" ? tpNum > refNum : tpNum < refNum;
}

export function validateSlPrice(referencePrice: unknown, slPrice: unknown, side: Side): boolean {
	const refNum = toNumber(referencePrice);
	const slNum = toNumber(slPrice);
	if (!isPositive(refNum) || !isPositive(slNum)) {
		return false;
	}
	return side === "buy" ? slNum < refNum : slNum > refNum;
}

export function getTpSlValidationError(
	referencePrice: unknown,
	tpPrice: number | null,
	slPrice: number | null,
	side: Side,
): string | null {
	if (isPositive(tpPrice) && !validateTpPrice(referencePrice, tpPrice, side)) {
		return side === "buy" ? "TP must be above entry price" : "TP must be below entry price";
	}
	if (isPositive(slPrice) && !validateSlPrice(referencePrice, slPrice, side)) {
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

export function formatRiskRewardRatio(ratio: unknown): RiskRewardDisplay | null {
	const ratioBig = toBig(ratio);
	if (!ratioBig || ratioBig.lte(0)) {
		return null;
	}

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

	const inverted = toBig(1)?.div(ratioBig);
	if (!inverted) return null;

	const rounded = inverted.round(1).toNumber();
	const isWhole = rounded === Math.round(rounded);
	return {
		risk: rounded,
		reward: 1,
		label: `${isWhole ? Math.round(rounded) : rounded.toFixed(1)}:1`,
		isFavorable,
	};
}
