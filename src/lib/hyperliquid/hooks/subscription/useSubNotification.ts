import type { NotificationWsEvent, NotificationWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { serializeKey, subscriptionKeys } from "../../query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useSub } from "../utils/useSub";

type NotificationEvent = NotificationWsEvent;
type NotificationParams = NotificationWsParameters;

export type UseSubNotificationParameters = NotificationParams;
export type UseSubNotificationOptions = SubscriptionOptions;
export type UseSubNotificationReturnType = SubscriptionResult<NotificationEvent>;

export function useSubNotification(
	params: UseSubNotificationParameters,
	options: UseSubNotificationOptions = {},
): UseSubNotificationReturnType {
	const { subscription } = useHyperliquid();
	const key = serializeKey(subscriptionKeys.method("notification", params));

	return useSub(key, (listener) => subscription.notification(params, listener), options);
}
