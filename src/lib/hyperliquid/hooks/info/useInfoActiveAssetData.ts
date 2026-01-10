import type { ActiveAssetDataParameters, ActiveAssetDataResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ActiveAssetDataData = ActiveAssetDataResponse;
type ActiveAssetDataParams = ActiveAssetDataParameters;

export type UseInfoActiveAssetDataParameters = ActiveAssetDataParams;
export type UseInfoActiveAssetDataOptions<TData = ActiveAssetDataData> = QueryParameter<ActiveAssetDataData, TData>;
export type UseInfoActiveAssetDataReturnType<TData = ActiveAssetDataData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function useInfoActiveAssetData<TData = ActiveAssetDataData>(
	params: UseInfoActiveAssetDataParameters,
	options: UseInfoActiveAssetDataOptions<TData> = {},
): UseInfoActiveAssetDataReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("activeAssetData", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.activeAssetData(params, signal),
	});
}
