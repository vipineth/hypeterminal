import { CHART_DEFAULT_PRICESCALE, CHART_QUOTE_ASSET } from "@/config/constants";

export function normalizeSymbolName(symbolName: string): string {
	const trimmed = symbolName.trim();
	const withoutExchange = trimmed.includes(":") ? (trimmed.split(":").pop() ?? trimmed) : trimmed;
	return withoutExchange.trim();
}

export function coinFromSymbolName(symbolName: string): string {
	const normalized = normalizeSymbolName(symbolName);
	return normalized.split(/[/-]/)[0] ?? normalized;
}

export function symbolFromCoin(coin: string): string {
	return `${coin}/${CHART_QUOTE_ASSET}`;
}

function inferDecimalPlaces(value: string): number {
	const match = value.match(/\.(\d+)/);
	if (!match) return 0;
	return match[1]?.replace(/0+$/, "").length ?? 0;
}

export function priceScaleFromMid(mid: string): number {
	const decimals = inferDecimalPlaces(mid);
	const digits = Math.min(Math.max(decimals, 2), 8);
	return 10 ** digits;
}

export function inferPriceScaleFromMids(coin: string, mids: Record<string, string>): number {
	const mid = mids[coin];
	if (typeof mid === "string" && mid.length > 0) {
		return priceScaleFromMid(mid);
	}
	return CHART_DEFAULT_PRICESCALE;
}
