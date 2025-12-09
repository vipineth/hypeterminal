import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

export function useAllMids() {
	return useQuery({
		queryKey: hyperliquidKeys.allMids(),
		queryFn: () => infoClient.allMids(),
		staleTime: 5 * 1000,
		refetchInterval: 5 * 1000,
	});
}
