import { useMemo } from "react";
import { buildPerpMarketRegistry } from "@/lib/hyperliquid/market-registry";
import { useMeta } from "./use-meta";

export function usePerpMarketRegistry() {
	const metaQuery = useMeta();
	const registry = useMemo(() => {
		if (!metaQuery.data) return undefined;
		return buildPerpMarketRegistry(metaQuery.data);
	}, [metaQuery.data]);

	return { ...metaQuery, registry };
}
