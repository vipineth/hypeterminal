import type { InfoClient, TxDetailsParameters, TxDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type TxDetailsData = TxDetailsResponse;
type TxDetailsParams = TxDetailsParameters;

export type UseInfoTxDetailsParameters = TxDetailsParams;
export type UseInfoTxDetailsOptions<TData = TxDetailsData> = QueryParameter<TxDetailsData, TData>;
export type UseInfoTxDetailsReturnType<TData = TxDetailsData> = UseQueryResult<TData, HyperliquidQueryError> & {
	queryKey: readonly unknown[];
};

export function getTxDetailsQueryOptions(info: InfoClient, params: TxDetailsParams): QueryOptions<TxDetailsData> {
	return {
		queryKey: infoKeys.method("txDetails", params),
		queryFn: ({ signal }) => info.txDetails(params, signal),
	};
}

export function useInfoTxDetails<TData = TxDetailsData>(
	params: UseInfoTxDetailsParameters,
	options: UseInfoTxDetailsOptions<TData> = {},
): UseInfoTxDetailsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getTxDetailsQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return {
		...query,
		queryKey: queryOptions.queryKey,
	};
}
