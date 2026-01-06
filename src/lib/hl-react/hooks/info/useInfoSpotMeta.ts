import type { SpotMetaResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotMetaData = SpotMetaResponse;

export type UseInfoSpotMetaOptions<TData = SpotMetaData> = QueryParameter<SpotMetaData, TData>;
export type UseInfoSpotMetaReturnType<TData = SpotMetaData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoSpotMeta<TData = SpotMetaData>(
	options: UseInfoSpotMetaOptions<TData> = {},
): UseInfoSpotMetaReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("spotMeta");

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.spotMeta(signal),
	});
}
