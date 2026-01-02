import { useQuery } from "@tanstack/react-query";
import { META_CACHE_TTL_MS } from "@/constants/app";
import { getInfoClient } from "@/lib/hyperliquid/clients";
import { hyperliquidKeys } from "@/lib/hyperliquid/query-keys";
import { readCachedMeta, writeCachedMeta } from "@/lib/hyperliquid/meta-cache";

const infoClient = getInfoClient();

export function useMeta() {
	const cached = readCachedMeta();

	return useQuery({
		queryKey: hyperliquidKeys.meta(),
		queryFn: async () => {
			const meta = await infoClient.meta();
			writeCachedMeta(meta);
			return meta;
		},
		initialData: () => cached?.value,
		initialDataUpdatedAt: () => cached?.updatedAt,
		staleTime: META_CACHE_TTL_MS,
		gcTime: 7 * META_CACHE_TTL_MS,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}
