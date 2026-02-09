import type { ISubscription } from "@nktkas/hyperliquid";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";
import { useHyperliquidStoreApi } from "@/lib/hyperliquid/provider";
import type { SubscriptionOptions, SubscriptionResult } from "@/lib/hyperliquid/types";
import { createThrottledUpdater } from "@/lib/websocket/batch-updater";
import { isPayloadOversized } from "@/lib/websocket/payload-guard";
import { getPayloadLimitBytesForSubscriptionKey } from "@/lib/websocket/reliability";

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
	const { enabled = true, throttleMs, maxPayloadBytes, dropOversizedPayload = true } = options;
	const store = useHyperliquidStoreApi();
	const entry = useStore(store, (state) => state.subscriptions[key]);
	const payloadLimitBytes = useMemo(
		() => maxPayloadBytes ?? getPayloadLimitBytesForSubscriptionKey(key),
		[key, maxPayloadBytes],
	);

	// Ref pattern: subscribe changes every render, but we only resubscribe
	// when `key` changes. The ref gives us the latest function without
	// adding it to deps.
	const subscribeRef = useRef(subscribe);
	subscribeRef.current = subscribe;

	useEffect(() => {
		if (!enabled) return;
		const state = store.getState();
		let droppedPayloads = 0;
		let lastWarningAt = 0;

		const shouldDropPayload = (data: TData): boolean => {
			if (!dropOversizedPayload) return false;

			const { estimatedBytes, oversized } = isPayloadOversized(data, payloadLimitBytes);
			if (!oversized) return false;

			droppedPayloads += 1;
			const now = Date.now();
			const shouldWarn = droppedPayloads === 1 || now - lastWarningAt >= 30_000;
			if (import.meta.env.DEV && shouldWarn) {
				lastWarningAt = now;
				console.warn(
					`[WebSocket] Dropped oversized payload for ${key}. Estimated: ${estimatedBytes}B, limit: ${payloadLimitBytes}B, dropped: ${droppedPayloads}`,
				);
			}
			return true;
		};

		if (throttleMs) {
			const updater = createThrottledUpdater<TData>((data) => state.setSubscriptionData(key, data), throttleMs);
			state.acquireSubscription(key, () =>
				subscribeRef.current((data) => {
					if (shouldDropPayload(data)) return;
					updater.add(data);
				}),
			);
			return () => {
				updater.flush();
				updater.destroy();
				store.getState().releaseSubscription(key);
			};
		}

		state.acquireSubscription(key, () =>
			subscribeRef.current((data) => {
				if (shouldDropPayload(data)) return;
				state.setSubscriptionData(key, data);
			}),
		);
		return () => store.getState().releaseSubscription(key);
	}, [dropOversizedPayload, enabled, key, payloadLimitBytes, store, throttleMs]);

	return {
		data: entry?.data as TData | undefined,
		status: entry?.status ?? "idle",
		error: entry?.error,
		unsubscribe: async () => store.getState().releaseSubscription(key),
		failureSignal: entry?.failureSignal,
	};
}
