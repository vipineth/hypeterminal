import Big from "big.js";
import { formatTriggerPxForOrder, OrderBuildError, type TpSl } from "@/domain/trade/orders";
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

interface TriggerCheck {
	triggerPx: Numeric;
	markPx: Numeric;
	side: Side;
	tpsl: TpSl;
	szDecimals: number;
}

export function isTriggerUncrossed({ triggerPx, markPx, side, tpsl, szDecimals }: TriggerCheck): boolean {
	const mark = toSafeBig(markPx);
	if (mark.lte(0)) return false;

	const closeSide = side === "buy" ? "sell" : "buy";
	const firesOnRise = (closeSide === "buy") === (tpsl === "sl");
	let wirePx: string;
	try {
		wirePx = formatTriggerPxForOrder(triggerPx, { szDecimals, kind: "perp" }, closeSide, tpsl);
	} catch (error) {
		if (error instanceof OrderBuildError) return false;
		throw error;
	}
	return firesOnRise ? Big(wirePx).gt(mark) : Big(wirePx).lt(mark);
}

export interface EntryTriggerReference {
	px: number;
	source: "mark" | "limit";
}

export function getEntryTriggerReference(side: Side, orderPx: number, markPx: number): EntryTriggerReference {
	const limitFillsFirst = side === "buy" ? orderPx < markPx : orderPx > markPx;
	if (orderPx > 0 && limitFillsFirst) return { px: orderPx, source: "limit" };
	return { px: markPx, source: "mark" };
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
