import type { AllDexsAssetCtxsEvent, SpotAssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";

export type AllDexsAssetCtxs = AllDexsAssetCtxsEvent["ctxs"];
export type DexAssetCtxs = AllDexsAssetCtxs[number];
export type DexAssetCtx = DexAssetCtxs[1][number];

export type SpotAssetCtx = SpotAssetCtxsEvent[number];
export type SpotAssetCtxs = SpotAssetCtxsEvent;
