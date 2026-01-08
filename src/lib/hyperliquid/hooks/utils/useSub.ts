import { useEffect } from "react";
import type { ISubscription } from "@nktkas/hyperliquid";
import { useStore } from "zustand";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidStoreApi } from "../useConfig";

export function useSub<TData>(
  key: string,
  subscribe: (listener: (data: TData) => void) => Promise<ISubscription>,
  options: SubscriptionOptions<TData> = {},
): SubscriptionResult<TData> {
  const { enabled = true, onData, onError } = options;
  const store = useHyperliquidStoreApi();
  const entry = useStore(store, (state) => state.subscriptions[key]);

  useEffect(() => {
    if (!enabled) return;
    const state = store.getState();
    state.acquireSubscription(key, () => subscribe((data) => state.setSubscriptionData(key, data)));
    return () => {
      store.getState().releaseSubscription(key);
    };
  }, [enabled, key, store, subscribe]);

  useEffect(() => {
    if (entry?.data !== undefined) {
      onData?.(entry.data as TData);
    }
  }, [entry?.data, onData]);

  useEffect(() => {
    if (entry?.error !== undefined) {
      onError?.(entry.error);
    }
  }, [entry?.error, onError]);

  return {
    data: entry?.data as TData | undefined,
    status: entry?.status ?? "idle",
    error: entry?.error,
    unsubscribe: async () => store.getState().releaseSubscription(key),
    failureSignal: entry?.failureSignal,
  };
}
