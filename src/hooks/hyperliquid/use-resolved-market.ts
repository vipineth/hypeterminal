import { useMemo } from "react";
import type { PerpMarketKey } from "@/lib/hyperliquid/market-key";
import type { PerpMarketRegistry } from "@/lib/hyperliquid/market-registry";
import { isPerpMarketKey, perpCoinFromMarketKey } from "@/lib/hyperliquid/market-key";
import { useSelectedMarketKey } from "@/stores/use-market-prefs-store";
import type { PerpAssetCtx } from "@/types/hyperliquid";
import { useActiveAssetCtxSubscription } from "./socket/use-active-asset-ctx-subscription";
import { useAllMidsSubscription } from "./socket/use-all-mids-subscription";
import { usePerpAssetCtxsSnapshot } from "./use-perp-asset-ctxs-snapshot";
import { usePerpMarketRegistry } from "./use-market-registry";

export type ResolvedPerpMarket = {
	kind: "perp";
	marketKey: PerpMarketKey;
	coin: string;
	assetIndex?: number;
	assetId?: number;
	szDecimals?: number;
	maxLeverage?: number;
	isDelisted?: boolean;
	ctx?: PerpAssetCtx;
	midPx?: string;
};

export type ResolvedMarket = ResolvedPerpMarket;

type CtxMode = "realtime" | "snapshot" | "none";

interface UseResolvedMarketOptions {
	enabled?: boolean;
	ctxMode?: CtxMode;
	snapshotIntervalMs?: number;
}

function resolvePerpMarket(registry: PerpMarketRegistry | undefined, marketKey: string | undefined) {
	if (!registry || !marketKey || !isPerpMarketKey(marketKey)) return undefined;
	return registry.marketKeyToInfo.get(marketKey);
}

export function useResolvedMarket(marketKey: string | undefined, options?: UseResolvedMarketOptions) {
	const enabled = options?.enabled ?? true;
	const ctxMode = options?.ctxMode ?? "snapshot";

	const metaQuery = usePerpMarketRegistry();
	const registry = metaQuery.registry;

	const perpMarketKey = marketKey && isPerpMarketKey(marketKey) ? marketKey : undefined;
	const coin = perpMarketKey ? perpCoinFromMarketKey(perpMarketKey) : undefined;

	const info = useMemo(() => resolvePerpMarket(registry, perpMarketKey), [registry, perpMarketKey]);
	const assetIndex = info?.assetIndex;

	const { data: mids } = useAllMidsSubscription<Record<string, string> | undefined>({
		enabled,
		select: (event) => event?.mids,
	});

	const { data: activeCtx } = useActiveAssetCtxSubscription({
		enabled: enabled && ctxMode === "realtime" && !!coin,
		params: coin ? { coin } : (undefined as never),
		select: (event) => event?.ctx,
	});

	const snapshotCtxs = usePerpAssetCtxsSnapshot({
		enabled: enabled && ctxMode === "snapshot",
		intervalMs: options?.snapshotIntervalMs,
	});

	const ctx =
		ctxMode === "realtime"
			? activeCtx
			: ctxMode === "snapshot" && typeof assetIndex === "number"
				? snapshotCtxs?.[assetIndex]
				: undefined;

	const resolved = useMemo<ResolvedMarket | undefined>(() => {
		if (!perpMarketKey || !coin) return undefined;

		return {
			kind: "perp",
			marketKey: perpMarketKey,
			coin,
			assetIndex: info?.assetIndex,
			assetId: info?.assetIndex,
			szDecimals: info?.szDecimals,
			maxLeverage: info?.maxLeverage,
			isDelisted: info?.isDelisted,
			ctx,
			midPx: coin ? mids?.[coin] : undefined,
		};
	}, [perpMarketKey, coin, info, ctx, mids]);

	return { data: resolved, isLoading: metaQuery.isLoading, error: metaQuery.error, refetch: metaQuery.refetch, registry };
}

export function useSelectedResolvedMarket(options?: Omit<UseResolvedMarketOptions, "enabled">) {
	const selectedMarketKey = useSelectedMarketKey();
	return useResolvedMarket(selectedMarketKey, { ...options, ctxMode: options?.ctxMode ?? "realtime" });
}
