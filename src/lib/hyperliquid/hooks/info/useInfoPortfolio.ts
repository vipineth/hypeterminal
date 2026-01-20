import type { InfoClient, PortfolioParameters, PortfolioResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type PortfolioData = PortfolioResponse;
type PortfolioParams = PortfolioParameters;

export type UseInfoPortfolioParameters = PortfolioParams;
export type UseInfoPortfolioOptions<TData = PortfolioData> = QueryParameter<PortfolioData, TData>;
export type UseInfoPortfolioReturnType<TData = PortfolioData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getPortfolioQueryOptions(info: InfoClient, params: PortfolioParams): QueryOptions<PortfolioData> {
	return {
		queryKey: infoKeys.method("portfolio", params),
		queryFn: ({ signal }) => info.portfolio(params, signal),
	};
}

export function useInfoPortfolio<TData = PortfolioData>(
	params: UseInfoPortfolioParameters,
	options: UseInfoPortfolioOptions<TData> = {},
): UseInfoPortfolioReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getPortfolioQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
