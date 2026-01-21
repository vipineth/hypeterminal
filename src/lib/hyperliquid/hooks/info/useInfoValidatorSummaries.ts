import type { InfoClient, ValidatorSummariesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ValidatorSummariesData = ValidatorSummariesResponse;

export type UseInfoValidatorSummariesOptions<TData = ValidatorSummariesData> = QueryParameter<
	ValidatorSummariesData,
	TData
>;
export type UseInfoValidatorSummariesReturnType<TData = ValidatorSummariesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getValidatorSummariesQueryOptions(info: InfoClient): QueryOptions<ValidatorSummariesData> {
	return {
		queryKey: infoKeys.method("validatorSummaries"),
		queryFn: ({ signal }) => info.validatorSummaries(signal),
	};
}

export function useInfoValidatorSummaries<TData = ValidatorSummariesData>(
	options: UseInfoValidatorSummariesOptions<TData> = {},
): UseInfoValidatorSummariesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getValidatorSummariesQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
