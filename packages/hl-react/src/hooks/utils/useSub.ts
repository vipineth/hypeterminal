import type { ISubscription } from "@nktkas/hyperliquid";
import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import { createThrottledUpdater } from "../../internal/websocket/batch-updater";
import { isPayloadOversized } from "../../internal/websocket/payload-guard";
import {
	getPayloadLimitBytesForSubscriptionKey,
	getStalenessThresholdForKey,
} from "../../internal/websocket/reliability";
import { useHyperliquidStoreApi } from "../../provider";
import type { SubscriptionOptions, SubscriptionResult } from "../../types";

export function useSub<TData>(
	key: string,
	subscribe: (listener: (data: TData) => void, onError: (error: unknown) => void) => Promise<ISubscription>,
	options: SubscriptionOptions = {},
): SubscriptionResult<TData> {
	const {
		enabled = true,
		throttleMs,
		maxStaleMs,
		maxPayloadBytes,
		dropOversizedPayload = true,
		pauseWhenHidden,
	} = options;
	const stalenessThresholdMs = maxStaleMs ?? getStalenessThresholdForKey(key);
	const store = useHyperliquidStoreApi();
	const entry = useStore(store, (state) => state.subscriptions[key]);
	const payloadLimitBytes = maxPayloadBytes ?? getPayloadLimitBytesForSubscriptionKey(key);

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
			state.acquireSubscription(
				key,
				(onError) =>
					subscribeRef.current((data) => {
						if (shouldDropPayload(data)) return;
						updater.add(data);
					}, onError),
				stalenessThresholdMs,
				pauseWhenHidden,
			);
			return () => {
				updater.flush();
				updater.destroy();
				store.getState().releaseSubscription(key);
			};
		}

		state.acquireSubscription(
			key,
			(onError) =>
				subscribeRef.current((data) => {
					if (shouldDropPayload(data)) return;
					state.setSubscriptionData(key, data);
				}, onError),
			stalenessThresholdMs,
			pauseWhenHidden,
		);
		return () => store.getState().releaseSubscription(key);
	}, [dropOversizedPayload, enabled, key, pauseWhenHidden, payloadLimitBytes, stalenessThresholdMs, store, throttleMs]);

	return {
		data: entry?.data as TData | undefined,
		status: entry?.status ?? "idle",
		error: entry?.error,
		isStale: entry?.isStale ?? false,
		unsubscribe: async () => store.getState().releaseSubscription(key),
	};
}
