import type { ValidatorSummariesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("validatorSummaries");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.validatorSummaries(signal),
	});
}
