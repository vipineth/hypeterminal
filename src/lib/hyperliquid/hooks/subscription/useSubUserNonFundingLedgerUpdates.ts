import type { UserNonFundingLedgerUpdatesWsEvent, UserNonFundingLedgerUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";

type UserNonFundingLedgerUpdatesEvent = UserNonFundingLedgerUpdatesWsEvent;
type UserNonFundingLedgerUpdatesParams = UserNonFundingLedgerUpdatesWsParameters;

export type UseSubUserNonFundingLedgerUpdatesParameters = UserNonFundingLedgerUpdatesParams;
export type UseSubUserNonFundingLedgerUpdatesOptions = SubscriptionOptions<UserNonFundingLedgerUpdatesEvent>;
export type UseSubUserNonFundingLedgerUpdatesReturnType = SubscriptionResult<UserNonFundingLedgerUpdatesEvent>;

export function useSubUserNonFundingLedgerUpdates(
	params: UseSubUserNonFundingLedgerUpdatesParameters,
	options: UseSubUserNonFundingLedgerUpdatesOptions = {},
): UseSubUserNonFundingLedgerUpdatesReturnType {
	const { subscription } = useHyperliquidClients();
	const key = serializeKey(subscriptionKeys.method("userNonFundingLedgerUpdates", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserNonFundingLedgerUpdatesEvent) => void) =>
			subscription.userNonFundingLedgerUpdates(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
