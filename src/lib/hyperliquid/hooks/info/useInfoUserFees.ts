import type { InfoClient, UserFeesParameters, UserFeesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type UserFeesData = UserFeesResponse;
type UserFeesParams = UserFeesParameters;

export type UseInfoUserFeesParameters = UserFeesParams;
export type UseInfoUserFeesOptions<TData = UserFeesData> = QueryParameter<UserFeesData, TData>;
export type UseInfoUserFeesReturnType<TData = UserFeesData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getUserFeesQueryOptions(info: InfoClient, params: UserFeesParams): QueryOptions<UserFeesData> {
	return {
		queryKey: infoKeys.method("userFees", params),
		queryFn: ({ signal }) => info.userFees(params, signal),
	};
}

export function useInfoUserFees<TData = UserFeesData>(
	params: UseInfoUserFeesParameters,
	options: UseInfoUserFeesOptions<TData> = {},
): UseInfoUserFeesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserFeesQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
