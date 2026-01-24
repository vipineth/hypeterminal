import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

export type PerpAsset = MetaResponse["universe"][number];
export type PerpDex = NonNullable<PerpDexsResponse[number]>;
export type SpotPair = SpotMetaResponse["universe"][number];
export type SpotToken = SpotMetaResponse["tokens"][number];

export function isPerpDelisted(asset: PerpAsset): boolean {
	return asset.isDelisted === true;
}

export function isPerpOnlyIsolated(asset: PerpAsset): boolean {
	return asset.onlyIsolated === true;
}
