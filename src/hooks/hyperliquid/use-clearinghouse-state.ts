import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseClearinghouseStateParams {
	user: `0x${string}` | undefined;
	enabled?: boolean;
	refetchIntervalMs?: number;
}

export function useClearinghouseState(params: UseClearinghouseStateParams) {
	const enabled = params.enabled ?? true;

	return useQuery({
		queryKey: hyperliquidKeys.clearinghouseState(params.user ?? "0x0"),
		queryFn: () => infoClient.clearinghouseState({ user: params.user as `0x${string}` }),
		enabled: enabled && !!params.user,
		staleTime: 2_000,
		refetchInterval: params.refetchIntervalMs ?? 5_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}

