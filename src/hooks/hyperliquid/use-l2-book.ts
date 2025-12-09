import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseL2BookParams {
	coin: string;
}

export function useL2Book(params: UseL2BookParams) {
	return useQuery({
		queryKey: hyperliquidKeys.orderBook(params.coin),
		queryFn: () => infoClient.l2Book({ coin: params.coin }),
		staleTime: 1000,
		refetchInterval: 2000,
		enabled: !!params.coin,
	});
}
