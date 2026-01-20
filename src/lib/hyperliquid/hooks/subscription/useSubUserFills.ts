import type { UserFillsWsEvent, UserFillsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

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
