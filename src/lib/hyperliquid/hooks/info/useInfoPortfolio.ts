import type { PortfolioParameters, PortfolioResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

type PortfolioData = PortfolioResponse;
type PortfolioParams = PortfolioParameters;

export type UseInfoPortfolioParameters = PortfolioParams;
export type UseInfoPortfolioOptions<TData = PortfolioData> = QueryParameter<PortfolioData, TData>;
export type UseInfoPortfolioReturnType<TData = PortfolioData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoPortfolio<TData = PortfolioData>(
	params: UseInfoPortfolioParameters,
	options: UseInfoPortfolioOptions<TData> = {},
): UseInfoPortfolioReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("portfolio", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.portfolio(params, signal),
	});
}
