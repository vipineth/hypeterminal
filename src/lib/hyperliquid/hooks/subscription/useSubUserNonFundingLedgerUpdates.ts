import type { UserNonFundingLedgerUpdatesWsEvent, UserNonFundingLedgerUpdatesWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserNonFundingLedgerUpdatesEvent = UserNonFundingLedgerUpdatesWsEvent;
type UserNonFundingLedgerUpdatesParams = UserNonFundingLedgerUpdatesWsParameters;

export type UseSubUserNonFundingLedgerUpdatesParameters = UserNonFundingLedgerUpdatesParams;
export type UseSubUserNonFundingLedgerUpdatesOptions = SubscriptionOptions;
export type UseSubUserNonFundingLedgerUpdatesReturnType = SubscriptionResult<UserNonFundingLedgerUpdatesEvent>;

const MAX_LEDGER_UPDATES = 500;

export function useSubUserNonFundingLedgerUpdates(
	params: UseSubUserNonFundingLedgerUpdatesParameters,
	options: UseSubUserNonFundingLedgerUpdatesOptions = {},
): UseSubUserNonFundingLedgerUpdatesReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userNonFundingLedgerUpdates", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userNonFundingLedgerUpdates(params, listener),
		{
			getItems: (event) => event.nonFundingLedgerUpdates,
			withItems: (event, items) => ({ ...event, nonFundingLedgerUpdates: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_LEDGER_UPDATES,
				getKey: (u) => u.hash,
				compare: (a, b) => b.time - a.time,
			},
		},
		options,
	);
}
