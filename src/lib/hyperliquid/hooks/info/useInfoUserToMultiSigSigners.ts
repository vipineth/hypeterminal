import type { InfoClient, UserToMultiSigSignersParameters, UserToMultiSigSignersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type UserToMultiSigSignersData = UserToMultiSigSignersResponse;
type UserToMultiSigSignersParams = UserToMultiSigSignersParameters;

export type UseInfoUserToMultiSigSignersParameters = UserToMultiSigSignersParams;
export type UseInfoUserToMultiSigSignersOptions<TData = UserToMultiSigSignersData> = QueryParameter<
	UserToMultiSigSignersData,
	TData
>;
export type UseInfoUserToMultiSigSignersReturnType<TData = UserToMultiSigSignersData> = UseQueryResult<
	TData,
	HyperliquidQueryError
> & {
	queryKey: readonly unknown[];
};

export function getUserToMultiSigSignersQueryOptions(
	info: InfoClient,
	params: UserToMultiSigSignersParams,
): QueryOptions<UserToMultiSigSignersData> {
	return {
		queryKey: infoKeys.method("userToMultiSigSigners", params),
		queryFn: ({ signal }) => info.userToMultiSigSigners(params, signal),
	};
}

export function useInfoUserToMultiSigSigners<TData = UserToMultiSigSignersData>(
	params: UseInfoUserToMultiSigSignersParameters,
	options: UseInfoUserToMultiSigSignersOptions<TData> = {},
): UseInfoUserToMultiSigSignersReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserToMultiSigSignersQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
