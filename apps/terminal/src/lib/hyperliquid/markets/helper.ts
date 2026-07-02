import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import type { MarketKind } from "@/domain/market";
import { BUILDER_DEX_SEPARATOR, PERP_MARKET_NAME_SEPARATOR, SPOT_MARKET_NAME_SEPARATOR } from "@/domain/market";

export const SPOT_ASSET_ID_BASE = 10_000;
export const BUILDER_PERP_ASSET_ID_BASE = 100_000;
export const BUILDER_PERP_SLOTS_PER_DEX = 10_000;

export function getPerpAssetId(index: number): number {
	return index;
}

export function getSpotAssetId(pairIndex: number): number {
	return SPOT_ASSET_ID_BASE + pairIndex;
}

export function getBuilderPerpAssetId(dexIndex: number, assetIndex: number): number {
	return BUILDER_PERP_ASSET_ID_BASE + dexIndex * BUILDER_PERP_SLOTS_PER_DEX + assetIndex;
}

export function getMarketKindFromName(name: string): MarketKind {
	if (name.includes(BUILDER_DEX_SEPARATOR)) return "builderPerp";
	if (name.startsWith("@")) return "spot";
	return "perp";
}

export function getDexFromName(name: string): string | undefined {
	const separatorIdx = name.indexOf(BUILDER_DEX_SEPARATOR);
	if (separatorIdx <= 0) return undefined;
	return name.slice(0, separatorIdx);
}

export function getPerpDisplayName(name: string, quoteToken?: string): string {
	return `${name}${PERP_MARKET_NAME_SEPARATOR}${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
}

export function getSpotDisplayName(baseToken: string, quoteToken: string): string {
	return `${baseToken}${SPOT_MARKET_NAME_SEPARATOR}${quoteToken}`;
}

export function getBuilderPerpShortName(name: string): string {
	return name.includes(BUILDER_DEX_SEPARATOR) ? name.split(BUILDER_DEX_SEPARATOR)[1] : name;
}

export function getBuilderPerpDisplayName(name: string, quoteTokenName?: string): string {
	return `${getBuilderPerpShortName(name)}-${quoteTokenName ?? DEFAULT_QUOTE_TOKEN}`;
}
