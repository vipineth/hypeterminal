type Side = "buy" | "sell";

interface TpSlCalcParams {
	referencePrice: number;
	side: Side;
	size: number;
}

export function calculateTpPrice(referencePrice: number, side: Side, tpPercent: number): number {
	if (!Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(tpPercent)) {
		return 0;
	}
	const multiplier = side === "buy" ? 1 + tpPercent / 100 : 1 - tpPercent / 100;
	return referencePrice * multiplier;
}

export function calculateSlPrice(referencePrice: number, side: Side, slPercent: number): number {
	if (!Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(slPercent)) {
		return 0;
	}
	const multiplier = side === "buy" ? 1 - slPercent / 100 : 1 + slPercent / 100;
	return referencePrice * multiplier;
}

export function calculatePercentFromPrice(
	referencePrice: number,
	targetPrice: number,
	side: Side,
	type: "tp" | "sl",
): number {
	if (
		!Number.isFinite(referencePrice) ||
		referencePrice <= 0 ||
		!Number.isFinite(targetPrice) ||
		targetPrice <= 0
	) {
		return 0;
	}
	const diff = targetPrice - referencePrice;
	const percent = (diff / referencePrice) * 100;

	if (type === "tp") {
		return side === "buy" ? percent : -percent;
	}
	return side === "buy" ? -percent : percent;
}

export function calculateEstimatedPnl(params: TpSlCalcParams, targetPrice: number): number {
	if (
		!Number.isFinite(params.referencePrice) ||
		params.referencePrice <= 0 ||
		!Number.isFinite(targetPrice) ||
		targetPrice <= 0 ||
		!Number.isFinite(params.size) ||
		params.size <= 0
	) {
		return 0;
	}
	const priceDiff = targetPrice - params.referencePrice;
	return params.side === "buy" ? priceDiff * params.size : -priceDiff * params.size;
}

export function validateTpPrice(referencePrice: number, tpPrice: number, side: Side): boolean {
	if (!Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(tpPrice) || tpPrice <= 0) {
		return false;
	}
	return side === "buy" ? tpPrice > referencePrice : tpPrice < referencePrice;
}

export function validateSlPrice(referencePrice: number, slPrice: number, side: Side): boolean {
	if (!Number.isFinite(referencePrice) || referencePrice <= 0 || !Number.isFinite(slPrice) || slPrice <= 0) {
		return false;
	}
	return side === "buy" ? slPrice < referencePrice : slPrice > referencePrice;
}

export function getTpSlValidationError(
	referencePrice: number,
	tpPrice: number | null,
	slPrice: number | null,
	side: Side,
): string | null {
	if (tpPrice !== null && tpPrice > 0 && !validateTpPrice(referencePrice, tpPrice, side)) {
		return side === "buy" ? "TP must be above entry price" : "TP must be below entry price";
	}
	if (slPrice !== null && slPrice > 0 && !validateSlPrice(referencePrice, slPrice, side)) {
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

export function formatRiskRewardRatio(ratio: number): RiskRewardDisplay | null {
	if (!Number.isFinite(ratio) || ratio <= 0) {
		return null;
	}

	const isFavorable = ratio >= 1;

	if (ratio >= 1) {
		const rounded = Math.round(ratio * 10) / 10;
		const isWhole = rounded === Math.round(rounded);
		return {
			risk: 1,
			reward: rounded,
			label: `1:${isWhole ? Math.round(rounded) : rounded.toFixed(1)}`,
			isFavorable,
		};
	}

	const inverted = 1 / ratio;
	const rounded = Math.round(inverted * 10) / 10;
	const isWhole = rounded === Math.round(rounded);
	return {
		risk: rounded,
		reward: 1,
		label: `${isWhole ? Math.round(rounded) : rounded.toFixed(1)}:1`,
		isFavorable,
	};
}
