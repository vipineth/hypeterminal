import type { UserNonFundingLedgerUpdatesWsEvent, UserNonFundingLedgerUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type UserNonFundingLedgerUpdatesEvent = UserNonFundingLedgerUpdatesWsEvent;
type UserNonFundingLedgerUpdatesParams = UserNonFundingLedgerUpdatesWsParameters;

export type UseSubUserNonFundingLedgerUpdatesParameters = UserNonFundingLedgerUpdatesParams;
export type UseSubUserNonFundingLedgerUpdatesOptions = SubscriptionOptions;
export type UseSubUserNonFundingLedgerUpdatesReturnType = SubscriptionResult<UserNonFundingLedgerUpdatesEvent>;

export function useSubUserNonFundingLedgerUpdates(
	params: UseSubUserNonFundingLedgerUpdatesParameters,
	options: UseSubUserNonFundingLedgerUpdatesOptions = {},
): UseSubUserNonFundingLedgerUpdatesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userNonFundingLedgerUpdates", params));

	return useSub(key, (listener) => subscription.userNonFundingLedgerUpdates(params, listener), options);
}
