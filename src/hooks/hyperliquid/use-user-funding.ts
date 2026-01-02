import { useQuery } from "@tanstack/react-query";
import { getInfoClient } from "@/lib/hyperliquid/clients";
import { hyperliquidKeys } from "@/lib/hyperliquid/query-keys";

const infoClient = getInfoClient();

interface UseUserFundingParams {
	user: `0x${string}` | undefined;
	enabled?: boolean;
	lookbackMs?: number;
	refetchIntervalMs?: number;
}

export function useUserFunding(params: UseUserFundingParams) {
	const enabled = params.enabled ?? true;
	const lookbackMs = params.lookbackMs ?? 1000 * 60 * 60 * 24 * 7;

	return useQuery({
		queryKey: [...hyperliquidKeys.userFunding(params.user ?? "0x0"), { lookbackMs }] as const,
		queryFn: () =>
			infoClient.userFunding({
				user: params.user as `0x${string}`,
				startTime: Date.now() - lookbackMs,
				endTime: null,
			}),
		enabled: enabled && !!params.user,
		staleTime: 30_000,
		refetchInterval: params.refetchIntervalMs ?? 60_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}
