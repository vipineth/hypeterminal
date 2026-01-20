import type { InfoClient, UserDexAbstractionInfoResponse, UserDexAbstractionParameters } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

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
> & {
	queryKey: readonly unknown[];
};

export function getUserDexAbstractionQueryOptions(
	info: InfoClient,
	params: UserDexAbstractionParams,
): QueryOptions<UserDexAbstractionData> {
	return {
		queryKey: infoKeys.method("userDexAbstraction", params),
		queryFn: ({ signal }) => info.userDexAbstraction(params, signal),
	};
}

export function useInfoUserDexAbstraction<TData = UserDexAbstractionData>(
	params: UseInfoUserDexAbstractionParameters,
	options: UseInfoUserDexAbstractionOptions<TData> = {},
): UseInfoUserDexAbstractionReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserDexAbstractionQueryOptions(info, params);
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
