import type { UserFillsWsEvent, UserFillsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

type UserFillsEvent = UserFillsWsEvent;
type UserFillsParams = UserFillsWsParameters;

export type UseSubUserFillsParameters = UserFillsParams;
export type UseSubUserFillsOptions = SubscriptionOptions;
export type UseSubUserFillsReturnType = SubscriptionResult<UserFillsEvent>;

export function useSubUserFills(
	params: UseSubUserFillsParameters,
	options: UseSubUserFillsOptions = {},
): UseSubUserFillsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFills", params));

	return useSub(key, (listener) => subscription.userFills(params, listener), options);
}
