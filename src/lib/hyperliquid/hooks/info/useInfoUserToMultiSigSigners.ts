import type { UserToMultiSigSignersParameters, UserToMultiSigSignersResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
>;

export function useInfoUserToMultiSigSigners<TData = UserToMultiSigSignersData>(
	params: UseInfoUserToMultiSigSignersParameters,
	options: UseInfoUserToMultiSigSignersOptions<TData> = {},
): UseInfoUserToMultiSigSignersReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("userToMultiSigSigners", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userToMultiSigSigners(params, signal),
	});
}
