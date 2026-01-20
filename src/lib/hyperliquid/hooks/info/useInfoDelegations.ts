import type { DelegationsParameters, DelegationsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type DelegationsData = DelegationsResponse;
type DelegationsParams = DelegationsParameters;

export type UseInfoDelegationsParameters = DelegationsParams;
export type UseInfoDelegationsOptions<TData = DelegationsData> = QueryParameter<DelegationsData, TData>;
export type UseInfoDelegationsReturnType<TData = DelegationsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getDelegationsQueryOptions(info: InfoClient, params: DelegationsParams): QueryOptions<DelegationsData> {
	return {
		queryKey: infoKeys.method("delegations", params),
		queryFn: ({ signal }) => info.delegations(params, signal),
	};
}

export function useInfoDelegations<TData = DelegationsData>(
	params: UseInfoDelegationsParameters,
	options: UseInfoDelegationsOptions<TData> = {},
): UseInfoDelegationsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getDelegationsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
