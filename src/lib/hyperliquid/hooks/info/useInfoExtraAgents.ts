import type { ExtraAgentsParameters, ExtraAgentsResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ExtraAgentsData = ExtraAgentsResponse;
type ExtraAgentsParams = ExtraAgentsParameters;

export type UseInfoExtraAgentsParameters = ExtraAgentsParams;
export type UseInfoExtraAgentsOptions<TData = ExtraAgentsData> = QueryParameter<ExtraAgentsData, TData>;
export type UseInfoExtraAgentsReturnType<TData = ExtraAgentsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getExtraAgentsQueryOptions(info: InfoClient, params: ExtraAgentsParams): QueryOptions<ExtraAgentsData> {
	return {
		queryKey: infoKeys.method("extraAgents", params),
		queryFn: ({ signal }) => info.extraAgents(params, signal),
	};
}

export function useInfoExtraAgents<TData = ExtraAgentsData>(
	params: UseInfoExtraAgentsParameters,
	options: UseInfoExtraAgentsOptions<TData> = {},
): UseInfoExtraAgentsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getExtraAgentsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
