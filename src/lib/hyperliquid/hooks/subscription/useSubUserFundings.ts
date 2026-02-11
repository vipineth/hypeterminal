import type { UserFundingsWsEvent, UserFundingsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { useAccumulatingSub } from "../utils/useAccumulatingSub";

type UserFundingsEvent = UserFundingsWsEvent;
type UserFundingsParams = UserFundingsWsParameters;

export type UseSubUserFundingsParameters = UserFundingsParams;
export type UseSubUserFundingsOptions = SubscriptionOptions;
export type UseSubUserFundingsReturnType = SubscriptionResult<UserFundingsEvent>;

const MAX_FUNDINGS = 500;

export function useSubUserFundings(
	params: UseSubUserFundingsParameters,
	options: UseSubUserFundingsOptions = {},
): UseSubUserFundingsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFundings", params));

	return useAccumulatingSub(
		key,
		(listener) => subscription.userFundings(params, listener),
		{
			getItems: (event) => event.fundings,
			withItems: (event, items) => ({ ...event, fundings: items }),
			isSnapshot: (event) => event.isSnapshot === true,
			buffer: {
				maxSize: MAX_FUNDINGS,
				getKey: (f) => `${f.time}-${f.coin}`,
				compare: (a, b) => b.time - a.time,
			},
		},
		options,
	);
}
