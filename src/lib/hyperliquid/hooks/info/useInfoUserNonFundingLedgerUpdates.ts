import type { UserNonFundingLedgerUpdatesParameters, UserNonFundingLedgerUpdatesResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquid } from "../../context";

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

export function useInfoUserNonFundingLedgerUpdates<TData = UserNonFundingLedgerUpdatesData>(
	params: UseInfoUserNonFundingLedgerUpdatesParameters,
	options: UseInfoUserNonFundingLedgerUpdatesOptions<TData> = {},
): UseInfoUserNonFundingLedgerUpdatesReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("userNonFundingLedgerUpdates", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.userNonFundingLedgerUpdates(params, signal),
	});
}
