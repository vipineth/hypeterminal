import Big from "big.js";
import type { Market } from "@/domain/market/model";
import {
	formatPriceForOrder,
	formatTriggerPxForOrder,
	OrderBuildError,
	type TpSl,
} from "@/domain/trade/orders";
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

export type TriggerVerdict = "uncrossed" | "crossed" | "invalid";

interface TriggerCheck {
	triggerPx: string;
	referencePx: string;
	side: Side;
	tpsl: TpSl;
	szDecimals: number;
}

export function checkTrigger({ triggerPx, referencePx, side, tpsl, szDecimals }: TriggerCheck): TriggerVerdict {
	const closeSide = side === "buy" ? "sell" : "buy";
	const firesOnRise = (closeSide === "buy") === (tpsl === "sl");
	let wirePx: string;
	try {
		wirePx = formatTriggerPxForOrder(triggerPx, perpMarket(szDecimals), closeSide, tpsl);
	} catch (error) {
		if (error instanceof OrderBuildError) return "invalid";
		throw error;
	}
	const uncrossed = firesOnRise ? Big(wirePx).gt(referencePx) : Big(wirePx).lt(referencePx);
	return uncrossed ? "uncrossed" : "crossed";
}

export interface EntryTriggerReference {
	px: string;
	source: "mark" | "limit";
}

interface EntryReferenceInput {
	side: Side;
	limitPriceInput: string | null;
	markPx: string;
	szDecimals: number;
}

export function getEntryTriggerReference({
	side,
	limitPriceInput,
	markPx,
	szDecimals,
}: EntryReferenceInput): EntryTriggerReference {
	const wireLimit = limitPriceInput === null ? null : formatEntryLimit(limitPriceInput, side, szDecimals);
	if (wireLimit === null) return { px: markPx, source: "mark" };
	const limitFillsFirst = side === "buy" ? Big(wireLimit).lt(markPx) : Big(wireLimit).gt(markPx);
	return limitFillsFirst ? { px: wireLimit, source: "limit" } : { px: markPx, source: "mark" };
}

function formatEntryLimit(limitPriceInput: string, side: Side, szDecimals: number): string | null {
	try {
		return formatPriceForOrder(limitPriceInput, perpMarket(szDecimals), side, "passive");
	} catch (error) {
		if (error instanceof OrderBuildError) return null;
		throw error;
	}
}

function perpMarket(szDecimals: number): Pick<Market, "kind" | "szDecimals"> {
	return { szDecimals, kind: "perp" };
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
