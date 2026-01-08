import { useCallback, useMemo } from "react";
import type { NotificationWsEvent, NotificationWsParameters } from "@nktkas/hyperliquid";
import { useHyperliquidClients } from "../useClients";
import { useSub } from "../utils/useSub";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { serializeKey, subscriptionKeys } from "../../query/keys";

type NotificationEvent = NotificationWsEvent;
type NotificationParams = NotificationWsParameters;

export type UseSubNotificationParameters = NotificationParams;
export type UseSubNotificationOptions = SubscriptionOptions<NotificationEvent>;
export type UseSubNotificationReturnType = SubscriptionResult<NotificationEvent>;

export function useSubNotification(
  params: UseSubNotificationParameters,
  options: UseSubNotificationOptions = {},
): UseSubNotificationReturnType {
  const { subscription } = useHyperliquidClients();
  const key = serializeKey(subscriptionKeys.method("notification", params));
  const stableParams = useMemo(() => params, [key]);

  const subscribe = useCallback(
    (listener: (data: NotificationEvent) => void) => subscription.notification(stableParams, listener),
    [subscription, stableParams],
  );

  return useSub(key, subscribe, options);
}
