import { useQuery } from "@tanstack/react-query";
import { getInfoClient } from "@/lib/hyperliquid/clients";
import { hyperliquidKeys } from "@/lib/hyperliquid/query-keys";

const infoClient = getInfoClient();

interface UseOpenOrdersParams {
	user: `0x${string}` | undefined;
	enabled?: boolean;
	refetchIntervalMs?: number;
}

export function useOpenOrders(params: UseOpenOrdersParams) {
	const enabled = params.enabled ?? true;

	return useQuery({
		queryKey: hyperliquidKeys.openOrders(params.user ?? "0x0"),
		queryFn: () => infoClient.openOrders({ user: params.user as `0x${string}` }),
		enabled: enabled && !!params.user,
		staleTime: 1_500,
		refetchInterval: params.refetchIntervalMs ?? 4_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}
