import type { ExtraAgentsParameters, ExtraAgentsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ExtraAgentsData = ExtraAgentsResponse;
type ExtraAgentsParams = ExtraAgentsParameters;

export type UseInfoExtraAgentsParameters = ExtraAgentsParams;
export type UseInfoExtraAgentsOptions<TData = ExtraAgentsData> = QueryParameter<ExtraAgentsData, TData>;
export type UseInfoExtraAgentsReturnType<TData = ExtraAgentsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoExtraAgents<TData = ExtraAgentsData>(
	params: UseInfoExtraAgentsParameters,
	options: UseInfoExtraAgentsOptions<TData> = {},
): UseInfoExtraAgentsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("extraAgents", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.extraAgents(params, signal),
	});
}
