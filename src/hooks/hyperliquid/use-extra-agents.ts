import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseExtraAgentsParams {
	user: `0x${string}` | undefined;
	enabled?: boolean;
	refetchIntervalMs?: number;
}

export function useExtraAgents(params: UseExtraAgentsParams) {
	const enabled = params.enabled ?? true;

	return useQuery({
		queryKey: hyperliquidKeys.extraAgents(params.user ?? "0x0"),
		queryFn: () => infoClient.extraAgents({ user: params.user as `0x${string}` }),
		enabled: enabled && !!params.user,
		staleTime: 10_000,
		refetchInterval: params.refetchIntervalMs ?? 30_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}

