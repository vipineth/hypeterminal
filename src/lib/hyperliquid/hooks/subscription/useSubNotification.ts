import type { NotificationWsEvent, NotificationWsParameters } from "@nktkas/hyperliquid";
import { useSub } from "@/lib/hyperliquid/hooks/utils/useSub";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { serializeKey, subscriptionKeys } from "@/lib/hyperliquid/query/keys";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";

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
