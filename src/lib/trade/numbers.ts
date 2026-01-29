import Big from "big.js";

export type { Big };

export function toBig(value: unknown): Big | null {
	if (value === null || value === undefined || value === "") return null;
	try {
		if (value instanceof Big) return value;
		if (typeof value === "number") {
			if (!Number.isFinite(value)) return null;
			return new Big(value);
		}
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) return null;
			return new Big(trimmed);
		}
		return null;
	} catch {
		return null;
	}
}

export function toBigOrZero(value: unknown): Big {
	return toBig(value) ?? new Big(0);
}

export function toNumber(value: unknown): number | null {
	const big = toBig(value);
	if (!big) return null;
	const num = big.toNumber();
	return Number.isFinite(num) ? num : null;
}

export function toNumberOrNaN(value: unknown): number {
	return toNumber(value) ?? Number.NaN;
}

export function toNumberOr(value: unknown, fallback: number): number {
	return toNumber(value) ?? fallback;
}

export function toNumberOrZero(value: unknown): number {
	return toNumber(value) ?? 0;
}

export function isPositive(value: unknown): value is number {
	const num = toNumber(value);
	return num !== null && num > 0;
}

export function isNonNegative(value: unknown): value is number {
	const num = toNumber(value);
	return num !== null && num >= 0;
}

export function isValidPrice(value: unknown): value is number {
	return isPositive(value);
}

export function isValidSize(value: unknown): value is number {
	return isPositive(value);
}

export function parseNumber(value: unknown): number {
	return toNumberOrNaN(value);
}

export function parseNumberOr(value: unknown, fallback: number): number {
	return toNumberOr(value, fallback);
}

export function parseNumberOrZero(value: unknown): number {
	return toNumberOrZero(value);
}

export function clamp(value: number, min: number, max: number): number {
	const big = toBig(value);
	if (!big) return min;
	const minBig = toBig(min);
	const maxBig = toBig(max);
	if (!minBig || !maxBig) return min;
	if (big.lt(minBig)) return min;
	if (big.gt(maxBig)) return max;
	return big.toNumber();
}

export function clampInt(value: number, min: number, max: number): number {
	return Math.round(clamp(value, min, max));
}

export function toFixed(value: unknown, decimals: number): string {
	const big = toBig(value);
	if (!big) return "0";
	return big.toFixed(decimals);
}

export function toFixedTrimmed(value: unknown, maxDecimals: number): string {
	const big = toBig(value);
	if (!big) return "0";
	return big.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

export function floor(value: unknown, decimals: number): number | null {
	const big = toBig(value);
	if (!big) return null;
	const factor = new Big(10).pow(decimals);
	const floored = big.times(factor).round(0, Big.roundDown).div(factor);
	return floored.toNumber();
}

export function ceil(value: unknown, decimals: number): number | null {
	const big = toBig(value);
	if (!big) return null;
	const factor = new Big(10).pow(decimals);
	const ceiled = big.times(factor).round(0, Big.roundUp).div(factor);
	return ceiled.toNumber();
}

export function floorToString(value: unknown, decimals: number): string {
	const floored = floor(value, decimals);
	if (floored === null) return "0";
	return new Big(floored).toFixed(decimals);
}

export function parsePositiveDecimalInput(input: string): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;
	if (!/^\d+(?:\.\d*)?$/.test(trimmed)) return null;
	const big = toBig(trimmed);
	if (!big || big.lte(0)) return null;
	return big.toNumber();
}

export const calc = {
	add(a: unknown, b: unknown): number | null {
		const bigA = toBig(a);
		const bigB = toBig(b);
		if (!bigA || !bigB) return null;
		return bigA.plus(bigB).toNumber();
	},

	subtract(a: unknown, b: unknown): number | null {
		const bigA = toBig(a);
		const bigB = toBig(b);
		if (!bigA || !bigB) return null;
		return bigA.minus(bigB).toNumber();
	},

	multiply(a: unknown, b: unknown): number | null {
		const bigA = toBig(a);
		const bigB = toBig(b);
		if (!bigA || !bigB) return null;
		return bigA.times(bigB).toNumber();
	},

	divide(a: unknown, b: unknown): number | null {
		const bigA = toBig(a);
		const bigB = toBig(b);
		if (!bigA || !bigB || bigB.eq(0)) return null;
		return bigA.div(bigB).toNumber();
	},

	percent(value: unknown, percent: unknown): number | null {
		const bigValue = toBig(value);
		const bigPercent = toBig(percent);
		if (!bigValue || !bigPercent) return null;
		return bigValue.times(bigPercent).div(100).toNumber();
	},

	percentChange(from: unknown, to: unknown): number | null {
		const bigFrom = toBig(from);
		const bigTo = toBig(to);
		if (!bigFrom || !bigTo || bigFrom.eq(0)) return null;
		return bigTo.minus(bigFrom).div(bigFrom).times(100).toNumber();
	},

	percentOf(part: unknown, whole: unknown): number | null {
		const bigPart = toBig(part);
		const bigWhole = toBig(whole);
		if (!bigPart || !bigWhole || bigWhole.eq(0)) return null;
		return bigPart.div(bigWhole).times(100).toNumber();
	},

	pnl(entryPrice: unknown, exitPrice: unknown, size: unknown): number | null {
		const entry = toBig(entryPrice);
		const exit = toBig(exitPrice);
		const sz = toBig(size);
		if (!entry || !exit || !sz || entry.lte(0) || exit.lte(0)) return null;
		return exit.minus(entry).times(sz).toNumber();
	},

	pnlPercent(entryPrice: unknown, exitPrice: unknown): number | null {
		const entry = toBig(entryPrice);
		const exit = toBig(exitPrice);
		if (!entry || !exit || entry.lte(0)) return null;
		return exit.minus(entry).div(entry).times(100).toNumber();
	},

	leverage(notional: unknown, margin: unknown): number | null {
		const bigNotional = toBig(notional);
		const bigMargin = toBig(margin);
		if (!bigNotional || !bigMargin || bigMargin.eq(0)) return null;
		return bigNotional.div(bigMargin).toNumber();
	},

	notional(price: unknown, size: unknown): number | null {
		return calc.multiply(price, size);
	},

	marginRequired(notional: unknown, leverage: unknown): number | null {
		return calc.divide(notional, leverage);
	},

	slippage(expectedPrice: unknown, actualPrice: unknown): number | null {
		const expected = toBig(expectedPrice);
		const actual = toBig(actualPrice);
		if (!expected || !actual || expected.eq(0)) return null;
		return actual.minus(expected).div(expected).abs().times(100).toNumber();
	},

	applySlippage(price: unknown, slippageBps: unknown, isBuy: boolean): number | null {
		const bigPrice = toBig(price);
		const bigSlippage = toBig(slippageBps);
		if (!bigPrice || !bigSlippage) return null;
		const multiplier = isBuy ? new Big(1).plus(bigSlippage.div(10000)) : new Big(1).minus(bigSlippage.div(10000));
		return bigPrice.times(multiplier).toNumber();
	},
};

export function formatDecimal(value: number, maxDecimals: number): string {
	return toFixedTrimmed(value, maxDecimals);
}

export function floorToDecimals(value: number, maxDecimals: number): number {
	return floor(value, maxDecimals) ?? Number.NaN;
}

export function formatDecimalFloor(value: string | number, maxDecimals: number): string {
	return floorToString(value, maxDecimals).replace(/\.?0+$/, "");
}

export function toFiniteNumber(value: unknown): number | null {
	return toNumber(value);
}

export function limitDecimalInput(input: string, maxDecimals: number): string {
	if (!input) return input;
	const decimalIndex = input.indexOf(".");
	if (decimalIndex === -1) return input;
	const decimalsInInput = input.length - decimalIndex - 1;
	if (decimalsInInput <= maxDecimals) return input;
	return input.slice(0, decimalIndex + maxDecimals + 1);
}

export function getValueColorClass(value: unknown): "text-positive" | "text-negative" {
	const num = toNumber(value);
	return num !== null && num >= 0 ? "text-positive" : "text-negative";
}
