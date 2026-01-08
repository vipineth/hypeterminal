import type { TxDetailsParameters, TxDetailsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TxDetailsData = TxDetailsResponse;
type TxDetailsParams = TxDetailsParameters;

export type UseInfoTxDetailsParameters = TxDetailsParams;
export type UseInfoTxDetailsOptions<TData = TxDetailsData> = QueryParameter<TxDetailsData, TData>;
export type UseInfoTxDetailsReturnType<TData = TxDetailsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoTxDetails<TData = TxDetailsData>(
	params: UseInfoTxDetailsParameters,
	options: UseInfoTxDetailsOptions<TData> = {},
): UseInfoTxDetailsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("txDetails", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.txDetails(params, signal),
	});
}
