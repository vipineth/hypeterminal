import type { UserDexAbstractionInfoResponse, UserDexAbstractionParameters } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UserDexAbstractionData = UserDexAbstractionInfoResponse;
type UserDexAbstractionParams = UserDexAbstractionParameters;

export type UseInfoUserDexAbstractionParameters = UserDexAbstractionParams;
export type UseInfoUserDexAbstractionOptions<TData = UserDexAbstractionData> = QueryParameter<
	UserDexAbstractionData,
	TData
>;
export type UseInfoUserDexAbstractionReturnType<TData = UserDexAbstractionData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoUserDexAbstraction<TData = UserDexAbstractionData>(
	params: UseInfoUserDexAbstractionParameters,
	options: UseInfoUserDexAbstractionOptions<TData> = {},
): UseInfoUserDexAbstractionReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("userDexAbstraction", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userDexAbstraction(params, signal),
	});
}
