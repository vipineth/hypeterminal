import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseMetaAndAssetCtxsOptions {
	enabled?: boolean;
}

export function useMetaAndAssetCtxs(options?: UseMetaAndAssetCtxsOptions) {
	return useQuery({
		queryKey: hyperliquidKeys.metaAndAssetCtxs(),
		queryFn: () => infoClient.metaAndAssetCtxs(),
		staleTime: 10 * 1000,
		refetchInterval: 10 * 1000,
		enabled: options?.enabled,
	});
}
