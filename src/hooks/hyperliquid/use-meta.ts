import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

export function useMeta() {
	return useQuery({
		queryKey: hyperliquidKeys.meta(),
		queryFn: () => infoClient.meta(),
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	});
}
