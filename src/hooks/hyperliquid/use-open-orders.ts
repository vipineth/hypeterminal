import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseOpenOrdersParams {
	user: `0x${string}`;
}

export function useOpenOrders(params: UseOpenOrdersParams) {
	return useQuery({
		queryKey: hyperliquidKeys.openOrders(params.user),
		queryFn: () => infoClient.openOrders({ user: params.user }),
		staleTime: 2 * 1000,
		refetchInterval: 5 * 1000,
		enabled: !!params.user,
	});
}
