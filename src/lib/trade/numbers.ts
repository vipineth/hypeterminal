import Big from "big.js";

export type { Big };

export type Numeric = string | number | null | undefined | Big;

export const BIG_ZERO = Big(0);

export function toBig(value: Numeric): Big | null {
	if (value == null || value === "") return null;
	if (value instanceof Big) return value;
	try {
		if (typeof value === "number") {
			if (!Number.isFinite(value)) return null;
			return new Big(value);
		}
		const trimmed = (value as string).trim();
		return trimmed ? new Big(trimmed) : null;
	} catch {
		return null;
	}
}

export function toSafeBig(value: Numeric): Big {
	return toBig(value) ?? BIG_ZERO;
}

export function toNumber(value: Numeric): number | null {
	const big = toBig(value);
	if (!big) return null;
	const num = big.toNumber();
	return Number.isFinite(num) ? num : null;
}

export function toNumberOrZero(value: Numeric): number {
	return toNumber(value) ?? 0;
}

export function isPositive(value: Numeric): boolean {
	const num = toNumber(value);
	return num !== null && num > 0;
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

export function toFixed(value: Numeric, decimals: number): string {
	const big = toBig(value);
	if (!big) return "0";
	return big.toFixed(decimals);
}

export function floor(value: Numeric, decimals: number): number | null {
	const big = toBig(value);
	if (!big) return null;
	const factor = new Big(10).pow(decimals);
	const floored = big.times(factor).round(0, Big.roundDown).div(factor);
	return floored.toNumber();
}

export function floorToString(value: Numeric, decimals: number): string {
	const floored = floor(value, decimals);
	if (floored === null) return "0";
	return new Big(floored).toFixed(decimals);
}

export function floorToDecimals(value: number, maxDecimals: number): number {
	return floor(value, maxDecimals) ?? Number.NaN;
}

export function formatDecimalFloor(value: Numeric, maxDecimals: number): string {
	return floorToString(value, maxDecimals).replace(/\.?0+$/, "");
}

export function limitDecimalInput(input: string, maxDecimals: number): string {
	if (!input) return input;
	const decimalIndex = input.indexOf(".");
	if (decimalIndex === -1) return input;
	const decimalsInInput = input.length - decimalIndex - 1;
	if (decimalsInInput <= maxDecimals) return input;
	return input.slice(0, decimalIndex + maxDecimals + 1);
}

export function getValueColorClass(value: Numeric): "text-market-up-primary" | "text-market-down-primary" {
	const num = toNumber(value);
	return num !== null && num >= 0 ? "text-market-up-primary" : "text-market-down-primary";
}
