import type { CandleSnapshotParameters, CandleSnapshotResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CandleSnapshotData = CandleSnapshotResponse;
type CandleSnapshotParams = CandleSnapshotParameters;

export type UseInfoCandleSnapshotParameters = CandleSnapshotParams;
export type UseInfoCandleSnapshotOptions<TData = CandleSnapshotData> = QueryParameter<CandleSnapshotData, TData>;
export type UseInfoCandleSnapshotReturnType<TData = CandleSnapshotData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoCandleSnapshot<TData = CandleSnapshotData>(
	params: UseInfoCandleSnapshotParameters,
	options: UseInfoCandleSnapshotOptions<TData> = {},
): UseInfoCandleSnapshotReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("candleSnapshot", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.candleSnapshot(params, signal),
	});
}
