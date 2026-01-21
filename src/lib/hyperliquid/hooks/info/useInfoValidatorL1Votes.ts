import type { InfoClient, ValidatorL1VotesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import type { QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type ValidatorL1VotesData = ValidatorL1VotesResponse;

export type UseInfoValidatorL1VotesOptions<TData = ValidatorL1VotesData> = QueryParameter<ValidatorL1VotesData, TData>;
export type UseInfoValidatorL1VotesReturnType<TData = ValidatorL1VotesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getValidatorL1VotesQueryOptions(info: InfoClient): QueryOptions<ValidatorL1VotesData> {
	return {
		queryKey: infoKeys.method("validatorL1Votes"),
		queryFn: ({ signal }) => info.validatorL1Votes(signal),
	};
}

export function useInfoValidatorL1Votes<TData = ValidatorL1VotesData>(
	options: UseInfoValidatorL1VotesOptions<TData> = {},
): UseInfoValidatorL1VotesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getValidatorL1VotesQueryOptions(info);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
