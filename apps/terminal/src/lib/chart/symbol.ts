import { CHART_DEFAULT_PRICESCALE } from "@/config/chart";
import { PERP_MARKET_NAME_SEPARATOR } from "@/domain/market/display";
import type { Market } from "@/domain/market/model";

export function coinFromSymbolName(symbolName: string): string {
	const trimmed = symbolName.trim();

	const colonIdx = trimmed.indexOf(":");
	if (colonIdx === -1) return trimmed;

	const beforeColon = trimmed.slice(0, colonIdx);

	const isExchangePrefix =
		beforeColon.toLowerCase() === "hyperliquid" ||
		(beforeColon === beforeColon.toUpperCase() && beforeColon.length > 4);

	if (isExchangePrefix) {
		return trimmed.slice(colonIdx + 1).trim();
	}

	return trimmed;
}

export function chartSymbolLabel(market: Market): string {
	if (market.kind === "spot") return market.pairName;
	return `${market.name}${PERP_MARKET_NAME_SEPARATOR}${market.quote.displayName}`;
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
