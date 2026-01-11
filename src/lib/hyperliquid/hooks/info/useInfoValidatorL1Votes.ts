import type { ValidatorL1VotesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ValidatorL1VotesData = ValidatorL1VotesResponse;

export type UseInfoValidatorL1VotesOptions<TData = ValidatorL1VotesData> = QueryParameter<ValidatorL1VotesData, TData>;
export type UseInfoValidatorL1VotesReturnType<TData = ValidatorL1VotesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoValidatorL1Votes<TData = ValidatorL1VotesData>(
	options: UseInfoValidatorL1VotesOptions<TData> = {},
): UseInfoValidatorL1VotesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("validatorL1Votes");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.validatorL1Votes(signal),
	});
}
