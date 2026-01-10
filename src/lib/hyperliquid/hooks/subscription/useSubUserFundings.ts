import type { UserFundingsWsEvent, UserFundingsWsParameters } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type UserFundingsEvent = UserFundingsWsEvent;
type UserFundingsParams = UserFundingsWsParameters;

export type UseSubUserFundingsParameters = UserFundingsParams;
export type UseSubUserFundingsOptions = SubscriptionOptions<UserFundingsEvent>;
export type UseSubUserFundingsReturnType = SubscriptionResult<UserFundingsEvent>;

export function useSubUserFundings(
	params: UseSubUserFundingsParameters,
	options: UseSubUserFundingsOptions = {},
): UseSubUserFundingsReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("userFundings", params));
	const stableParams = useMemo(() => params, [key]);

	const subscribe = useCallback(
		(listener: (data: UserFundingsEvent) => void) => subscription.userFundings(stableParams, listener),
		[subscription, stableParams],
	);

	return useSub(key, subscribe, options);
}
