import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { PERP_MARKET_NAME_SEPARATOR, SPOT_MARKET_NAME_SEPARATOR } from "@/domain/market";
import { BUILDER_DEX_SEPARATOR } from "@/domain/market/display";

export function getPerpAssetId(index: number): number {
	return index;
}

export function getSpotAssetId(pairIndex: number): number {
	return 10000 + pairIndex;
}

export function getBuilderPerpAssetId(dexIndex: number, assetIndex: number): number {
	return 100000 + dexIndex * 10000 + assetIndex;
}

export function getPerpDisplayName(name: string, quoteToken?: string): string {
	return `${name}${PERP_MARKET_NAME_SEPARATOR}${quoteToken ?? DEFAULT_QUOTE_TOKEN}`;
}

export function getSpotDisplayName(baseToken: string, quoteToken: string): string {
	return `${baseToken}${SPOT_MARKET_NAME_SEPARATOR}${quoteToken}`;
}

export function getBuilderPerpDisplayName(name: string, quoteTokenName?: string): string {
	const baseName = name.includes(BUILDER_DEX_SEPARATOR) ? name.split(BUILDER_DEX_SEPARATOR)[1] : name;
	return `${baseName}-${quoteTokenName ?? DEFAULT_QUOTE_TOKEN}`;
}
