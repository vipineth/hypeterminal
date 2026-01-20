import type { UserFundingsWsEvent, UserFundingsWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type UserFundingsEvent = UserFundingsWsEvent;
type UserFundingsParams = UserFundingsWsParameters;

export type UseSubUserFundingsParameters = UserFundingsParams;
export type UseSubUserFundingsOptions = SubscriptionOptions;
export type UseSubUserFundingsReturnType = SubscriptionResult<UserFundingsEvent>;

export function useSubUserFundings(
	params: UseSubUserFundingsParameters,
	options: UseSubUserFundingsOptions = {},
): UseSubUserFundingsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFundings", params));

	return useSub(key, (listener) => subscription.userFundings(params, listener), options);
}
