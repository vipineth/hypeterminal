import type { ISubscription } from "@nktkas/hyperliquid";
import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidStoreApi } from "../useConfig";

/**
 * Core subscription hook using the standard WebSocket pattern.
 *
 * - String key determines subscription identity
 * - Ref holds latest subscribe function (avoids stale closures)
 * - Single effect for subscribe/unsubscribe lifecycle
 */
export function useSub<TData>(
	key: string,
	subscribe: (listener: (data: TData) => void) => Promise<ISubscription>,
	options: SubscriptionOptions = {},
): SubscriptionResult<TData> {
	const { enabled = true } = options;
	const store = useHyperliquidStoreApi();
	const entry = useStore(store, (state) => state.subscriptions[key]);

	const subscribeRef = useRef(subscribe);
	subscribeRef.current = subscribe;

	useEffect(() => {
		if (!enabled) return;
		const state = store.getState();
		state.acquireSubscription(key, () => subscribeRef.current((data) => state.setSubscriptionData(key, data)));
		return () => store.getState().releaseSubscription(key);
	}, [enabled, key, store]);

	return {
		data: entry?.data as TData | undefined,
		status: entry?.status ?? "idle",
		error: entry?.error,
		unsubscribe: async () => store.getState().releaseSubscription(key),
		failureSignal: entry?.failureSignal,
	};
}
