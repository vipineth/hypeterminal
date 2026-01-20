import type { ISubscription } from "@nktkas/hyperliquid";
import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";
import { useHyperliquidStoreApi } from "../useConfig";

/**
 * Core subscription hook using the standard WebSocket pattern.
 *
 * Key stability: The `key` is a serialized string that includes params.
 * Object params are stabilized via `stableSubscriptionValue` (sorts keys,
 * normalizes hex addresses), so callers don't need to memoize params.
 *
 * Ref pattern: The `subscribe` function changes every render (it captures
 * current params). We use a ref to always have the latest function without
 * adding it to effect deps, which would cause unnecessary resubscriptions.
 * The effect only runs when `key` changes (i.e., when params actually change).
 */
export function useSub<TData>(
	key: string,
	subscribe: (listener: (data: TData) => void) => Promise<ISubscription>,
	options: SubscriptionOptions = {},
): SubscriptionResult<TData> {
	const { enabled = true } = options;
	const store = useHyperliquidStoreApi();
	const entry = useStore(store, (state) => state.subscriptions[key]);

	// Ref pattern: subscribe changes every render, but we only resubscribe
	// when `key` changes. The ref gives us the latest function without
	// adding it to deps.
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
