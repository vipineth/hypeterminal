import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import type { MarketKind } from "@/domain/market";
import { PERP_MARKET_NAME_SEPARATOR, SPOT_MARKET_NAME_SEPARATOR } from "@/domain/market";

// Perp: 0-9999
export function getPerpAssetId(index: number): number {
	return index;
}

export function getMarketKindFromName(name: string): MarketKind {
	if (name.includes(":")) return "builderPerp";
	if (name.startsWith("@")) return "spot";
	return "perp";
}

// Spot: 10000-99999
export function getSpotAssetId(pairIndex: number): number {
	return 10000 + pairIndex;
}

// Builder Perp: 100000+ (each dex gets 10000 slots)
export function getBuilderPerpAssetId(dexIndex: number, assetIndex: number): number {
	return 100000 + dexIndex * 10000 + assetIndex;
}

export function getBuilderPerpDisplayNameFromName(name: string, quoteToken?: string | null): string {
	const baseName = name.includes(":") ? name.split(":")[1] : name;
	return `${baseName}-${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
}

export function getSpotDisplayName(baseToken: string, quoteToken: string): string {
	return `${baseToken}${SPOT_MARKET_NAME_SEPARATOR}${quoteToken}`;
}

export function getPerpDisplayName(name: string, quoteToken?: string): string {
	return `${name}${PERP_MARKET_NAME_SEPARATOR}${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
}
