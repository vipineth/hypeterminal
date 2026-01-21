import type { UserFundingsWsEvent, UserFundingsWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
