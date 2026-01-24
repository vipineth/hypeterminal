import type {
	AllDexsAssetCtxsWsEvent,
	AssetCtxsEvent,
	SpotAssetCtxsWsEvent,
} from "@nktkas/hyperliquid/api/subscription";

export type PerpAssetCtx = AssetCtxsEvent["ctxs"][number];
export type PerpAssetCtxs = AssetCtxsEvent["ctxs"];

export type AllDexsAssetCtxs = AllDexsAssetCtxsWsEvent["ctxs"];
export type DexAssetCtxs = AllDexsAssetCtxs[number];
export type DexAssetCtx = DexAssetCtxs[1][number];

export type SpotAssetCtx = SpotAssetCtxsWsEvent[number];
export type SpotAssetCtxs = SpotAssetCtxsWsEvent;
