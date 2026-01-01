export function parseNumber(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) ? parsed : Number.NaN;
	}
	return Number.NaN;
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
	const num = Number.parseFloat(trimmed);
	if (!Number.isFinite(num) || num <= 0) return null;
	return num;
}
