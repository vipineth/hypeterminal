import { CHART_DEFAULT_PRICESCALE, CHART_QUOTE_ASSET } from "@/config/constants";

// Symbol format: "subscriptionId::displayName/QUOTE" or "coin/QUOTE"
// Examples: "@21::HYPE/USDC", "xyz:XYZ100::XYZ100/USDC", "BTC/USDC"
const DISPLAY_SEPARATOR = "::";

function parseSymbolParts(symbolName: string): { subscriptionId: string; displayName: string } {
	const trimmed = symbolName.trim();
	const separatorIdx = trimmed.indexOf(DISPLAY_SEPARATOR);

	if (separatorIdx !== -1) {
		const subscriptionId = trimmed.slice(0, separatorIdx);
		const displayPart = trimmed.slice(separatorIdx + DISPLAY_SEPARATOR.length);
		// Extract display name before the /QUOTE part
		const slashIdx = displayPart.indexOf("/");
		const displayName = slashIdx !== -1 ? displayPart.slice(0, slashIdx) : displayPart;
		return { subscriptionId, displayName };
	}

	// Legacy format without separator - use coin as both
	const normalized = normalizeSymbolName(trimmed);
	const slashIdx = normalized.indexOf("/");
	const coin = slashIdx !== -1 ? normalized.slice(0, slashIdx) : normalized;
	return { subscriptionId: coin, displayName: coin };
}

export function normalizeSymbolName(symbolName: string): string {
	const trimmed = symbolName.trim();

	// First check for display separator
	const separatorIdx = trimmed.indexOf(DISPLAY_SEPARATOR);
	if (separatorIdx !== -1) {
		// Return the subscription ID part (before ::)
		return trimmed.slice(0, separatorIdx);
	}

	const colonIdx = trimmed.indexOf(":");
	if (colonIdx === -1) return trimmed;

	const beforeColon = trimmed.slice(0, colonIdx);

	// Only strip if it looks like an exchange prefix (e.g., "Hyperliquid")
	// HIP-3 dex names are typically short identifiers like "xyz"
	const isExchangePrefix =
		beforeColon.toLowerCase() === "hyperliquid" ||
		(beforeColon === beforeColon.toUpperCase() && beforeColon.length > 4);

	if (isExchangePrefix) {
		return trimmed.slice(colonIdx + 1).trim();
	}

	return trimmed;
}

export function coinFromSymbolName(symbolName: string): string {
	const { subscriptionId } = parseSymbolParts(symbolName);
	return subscriptionId;
}

export function displayNameFromSymbolName(symbolName: string): string {
	const { displayName } = parseSymbolParts(symbolName);
	return displayName;
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
