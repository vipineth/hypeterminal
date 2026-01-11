import type { ValidatorSummariesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ValidatorSummariesData = ValidatorSummariesResponse;

export type UseInfoValidatorSummariesOptions<TData = ValidatorSummariesData> = QueryParameter<
	ValidatorSummariesData,
	TData
>;
export type UseInfoValidatorSummariesReturnType<TData = ValidatorSummariesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoValidatorSummaries<TData = ValidatorSummariesData>(
	options: UseInfoValidatorSummariesOptions<TData> = {},
): UseInfoValidatorSummariesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("validatorSummaries");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.validatorSummaries(signal),
	});
}
