export function toFiniteNumber(value: unknown): number | null {
	if (typeof value === "number") {
		// Reject Infinity, -Infinity, NaN, and values outside safe range
		if (!Number.isFinite(value) || value < -Number.MAX_SAFE_INTEGER || value > Number.MAX_SAFE_INTEGER) {
			return null;
		}
		return value;
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const parsed = Number(trimmed);
		// Reject Infinity, -Infinity, NaN, and values outside safe range
		if (!Number.isFinite(parsed) || parsed < -Number.MAX_SAFE_INTEGER || parsed > Number.MAX_SAFE_INTEGER) {
			return null;
		}
		return parsed;
	}
	return null;
}

export function parseNumber(value: unknown): number {
	const parsed = toFiniteNumber(value);
	return parsed ?? Number.NaN;
}

export function parseNumberOr(value: unknown, fallback: number): number {
	const parsed = toFiniteNumber(value);
	return parsed ?? fallback;
}

export function parseNumberOrZero(value: unknown): number {
	return parseNumberOr(value, 0);
}

export function clampInt(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatDecimal(value: number, maxDecimals: number) {
	if (!Number.isFinite(value)) return "0";
	return value.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

export function floorToDecimals(value: number, maxDecimals: number) {
	if (!Number.isFinite(value)) return Number.NaN;
	if (!Number.isFinite(maxDecimals) || maxDecimals < 0) return Number.NaN;
	const factor = 10 ** maxDecimals;
	if (!Number.isFinite(factor) || factor <= 0) return Number.NaN;
	return Math.floor(value * factor) / factor;
}

export function formatDecimalFloor(value: number, maxDecimals: number) {
	const floored = floorToDecimals(value, maxDecimals);
	if (!Number.isFinite(floored)) return "0";
	return floored.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

export function parsePositiveDecimalInput(input: string): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;
	if (!/^\d+(?:\.\d*)?$/.test(trimmed)) return null;
	const num = Number(trimmed);
	if (!Number.isFinite(num) || num <= 0) return null;
	return num;
}
