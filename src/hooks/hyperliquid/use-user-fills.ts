import { useQuery } from "@tanstack/react-query";
import { getInfoClient, hyperliquidKeys } from "@/lib/hyperliquid";

const infoClient = getInfoClient();

interface UseUserFillsParams {
	user: `0x${string}` | undefined;
	enabled?: boolean;
	aggregateByTime?: boolean;
	refetchIntervalMs?: number;
}

export function useUserFills(params: UseUserFillsParams) {
	const enabled = params.enabled ?? true;

	return useQuery({
		queryKey: [
			...hyperliquidKeys.userFills(params.user ?? "0x0"),
			{ aggregateByTime: params.aggregateByTime ?? false },
		] as const,
		queryFn: () =>
			infoClient.userFills({
				user: params.user as `0x${string}`,
				aggregateByTime: params.aggregateByTime,
			}),
		enabled: enabled && !!params.user,
		staleTime: 5_000,
		refetchInterval: params.refetchIntervalMs ?? 10_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}

