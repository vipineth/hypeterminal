import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getInfoClient } from "@/lib/hyperliquid/clients";
import { hyperliquidKeys } from "@/lib/hyperliquid/query-keys";

const infoClient = getInfoClient();

export function useExtraAgents(user: `0x${string}` | undefined) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: hyperliquidKeys.extraAgents(user ?? "0x0"),
		queryFn: () => infoClient.extraAgents({ user: user as `0x${string}` }),
		enabled: !!user,
		staleTime: 5_000,
		refetchInterval: 30_000,
	});

	const refetch = useCallback(async () => {
		if (!user) return { data: undefined };
		await queryClient.invalidateQueries({ queryKey: hyperliquidKeys.extraAgents(user) });
		return query.refetch();
	}, [queryClient, user, query]);

	return {
		agents: query.data,
		isLoading: query.isPending,
		refetch,
	};
}
