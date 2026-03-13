import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";

export type PerpAsset = MetaResponse["universe"][number];
export type PerpDex = NonNullable<PerpDexsResponse[number]>;
export type SpotPair = SpotMetaResponse["universe"][number];
export type SpotToken = SpotMetaResponse["tokens"][number];
