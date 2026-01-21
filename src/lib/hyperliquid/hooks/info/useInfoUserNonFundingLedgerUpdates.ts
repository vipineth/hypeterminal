import type {
	InfoClient,
	UserNonFundingLedgerUpdatesParameters,
	UserNonFundingLedgerUpdatesResponse,
} from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type UserNonFundingLedgerUpdatesData = UserNonFundingLedgerUpdatesResponse;
type UserNonFundingLedgerUpdatesParams = UserNonFundingLedgerUpdatesParameters;

export type UseInfoUserNonFundingLedgerUpdatesParameters = UserNonFundingLedgerUpdatesParams;
export type UseInfoUserNonFundingLedgerUpdatesOptions<TData = UserNonFundingLedgerUpdatesData> = QueryParameter<
	UserNonFundingLedgerUpdatesData,
	TData
>;
export type UseInfoUserNonFundingLedgerUpdatesReturnType<TData = UserNonFundingLedgerUpdatesData> = UseQueryResult<
	TData,
	HyperliquidQueryError
>;

export function getUserNonFundingLedgerUpdatesQueryOptions(
	info: InfoClient,
	params: UserNonFundingLedgerUpdatesParams,
): QueryOptions<UserNonFundingLedgerUpdatesData> {
	return {
		queryKey: infoKeys.method("userNonFundingLedgerUpdates", params),
		queryFn: ({ signal }) => info.userNonFundingLedgerUpdates(params, signal),
	};
}

export function useInfoUserNonFundingLedgerUpdates<TData = UserNonFundingLedgerUpdatesData>(
	params: UseInfoUserNonFundingLedgerUpdatesParameters,
	options: UseInfoUserNonFundingLedgerUpdatesOptions<TData> = {},
): UseInfoUserNonFundingLedgerUpdatesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getUserNonFundingLedgerUpdatesQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
