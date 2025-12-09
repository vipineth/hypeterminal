import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseClearinghouseStateParams {
	user: `0x${string}`;
}

export function useClearinghouseState(params: UseClearinghouseStateParams) {
	return useQuery({
		queryKey: hyperliquidKeys.clearinghouseState(params.user),
		queryFn: () => infoClient.clearinghouseState({ user: params.user }),
		staleTime: 5 * 1000,
		refetchInterval: 10 * 1000,
		enabled: !!params.user,
	});
}
