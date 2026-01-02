import type { AssetCtxsEvent } from "@nktkas/hyperliquid/api/subscription";

export type PerpAssetCtx = AssetCtxsEvent["ctxs"][number];
export type PerpAssetCtxs = AssetCtxsEvent["ctxs"];
