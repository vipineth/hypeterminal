import type { CandleSnapshotParameters, CandleSnapshotResponse, InfoClient } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type CandleSnapshotData = CandleSnapshotResponse;
type CandleSnapshotParams = CandleSnapshotParameters;

export type UseInfoCandleSnapshotParameters = CandleSnapshotParams;
export type UseInfoCandleSnapshotOptions<TData = CandleSnapshotData> = QueryParameter<CandleSnapshotData, TData>;
export type UseInfoCandleSnapshotReturnType<TData = CandleSnapshotData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getCandleSnapshotQueryOptions(
	info: InfoClient,
	params: CandleSnapshotParams,
): QueryOptions<CandleSnapshotData> {
	return {
		queryKey: infoKeys.method("candleSnapshot", params),
		queryFn: ({ signal }) => info.candleSnapshot(params, signal),
	};
}

export function useInfoCandleSnapshot<TData = CandleSnapshotData>(
	params: UseInfoCandleSnapshotParameters,
	options: UseInfoCandleSnapshotOptions<TData> = {},
): UseInfoCandleSnapshotReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getCandleSnapshotQueryOptions(info, params);

	const query = useQuery({
		...options,
		...queryOptions,
	});

	return query;
}
