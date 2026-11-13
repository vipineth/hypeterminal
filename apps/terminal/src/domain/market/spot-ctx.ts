import type { SpotMarket } from "@/domain/market/model";
import type { SpotAssetCtx, SpotAssetCtxs } from "@/types/hyperliquid";

export function findSpotCtx(spotCtxs: SpotAssetCtxs | undefined, market: SpotMarket): SpotAssetCtx | undefined {
	const ctx = spotCtxs?.[market.ctxIndex];
	if (!ctx || ctx.coin === undefined || ctx.coin === market.name) return ctx;
	return spotCtxs?.find((candidate) => candidate.coin === market.name);
}
