import type { UserNonFundingLedgerUpdatesWsEvent, UserNonFundingLedgerUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
