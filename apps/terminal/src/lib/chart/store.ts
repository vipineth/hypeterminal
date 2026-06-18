import { type SubscriptionStatus, serializeKey, subscriptionKeys, WS_RELIABILITY_LIMITS } from "@hypeterminal/hl-react";
import { createWsReconnectTrigger } from "@hypeterminal/hl-react/clients";
import { createHyperliquidStore, type HyperliquidStoreState } from "@hypeterminal/hl-react/store";
import { createStore, type StoreApi } from "zustand/vanilla";
import { getSubscriptionClient } from "@/lib/hyperliquid";
import { isTestnet } from "@/lib/network";
import type { Bar, SubscribeBarsCallback } from "@/types/charting_library";
import { candleEventToBar } from "./candle";
import type { CandleInterval } from "./resolution";

type CandleListener = {
	id: string;
	onTick: SubscribeBarsCallback;
	onResetCache: () => void;
};

type StreamStatus = "idle" | "connecting" | "active" | "error";

type CandleStream = {
	status: StreamStatus;
	listeners: Map<string, CandleListener>;
	lastBar?: Bar;
	error?: unknown;
};

type StreamRuntime = {
	sharedKey: string;
	detachSharedStore: () => void;
	lastData?: unknown;
	lastStatus?: StreamStatus;
};

type SharedSubscriptionEntry = HyperliquidStoreState["subscriptions"][string];

export type CandleStoreState = {
	streams: Record<string, CandleStream>;
	lastBarCache: Record<string, Bar>;
	subscribe: (
		streamKey: string,
		coin: string,
		interval: CandleInterval,
		listenerId: string,
		onTick: SubscribeBarsCallback,
		onResetCache: () => void,
	) => void;
	unsubscribe: (streamKey: string, listenerId: string) => void;
	setLastBar: (cacheKey: string, bar: Bar) => void;
	getLastBar: (cacheKey: string) => Bar | undefined;
};

export type CandleStore = StoreApi<CandleStoreState>;

const MAX_LAST_BAR_CACHE = WS_RELIABILITY_LIMITS.cache.maxChartLastBarEntries;
const CANDLE_STALENESS_THRESHOLD_MS = WS_RELIABILITY_LIMITS.staleness.perMethodThresholdMs.candle;

function streamKey(coin: string, interval: CandleInterval): string {
	return `${coin}:${interval}`;
}

function subscriptionKey(coin: string, interval: CandleInterval): string {
	return serializeKey(subscriptionKeys.method("candle", { coin, interval }));
}

function isSameBar(a: Bar | undefined, b: Bar | undefined): boolean {
	if (!a || !b) return false;
	return (
		a.time === b.time &&
		a.open === b.open &&
		a.high === b.high &&
		a.low === b.low &&
		a.close === b.close &&
		a.volume === b.volume
	);
}

function isBar(value: unknown): value is Bar {
	if (!value || typeof value !== "object") return false;
	const candidate = value as Partial<Bar>;
	return (
		typeof candidate.time === "number" &&
		typeof candidate.open === "number" &&
		typeof candidate.high === "number" &&
		typeof candidate.low === "number" &&
		typeof candidate.close === "number"
	);
}

function toStreamStatus(status: SubscriptionStatus | undefined): StreamStatus {
	if (status === "active" || status === "error") return status;
	if (status === "subscribing") return "connecting";
	return "idle";
}

export function createCandleStore(): CandleStore {
	const runtime = new Map<string, StreamRuntime>();
	const cacheLru = new Map<string, true>();
	const subscriptionStore = createHyperliquidStore({
		ssr: false,
		triggerReconnect: () => createWsReconnectTrigger(isTestnet())(),
	});

	const touchCacheKey = (cacheKey: string, cache: Record<string, Bar>) => {
		cacheLru.delete(cacheKey);
		cacheLru.set(cacheKey, true);

		while (cacheLru.size > MAX_LAST_BAR_CACHE) {
			const oldest = cacheLru.keys().next().value as string | undefined;
			if (!oldest) break;
			cacheLru.delete(oldest);
			delete cache[oldest];
		}
	};

	return createStore<CandleStoreState>((set, get) => {
		function setStreamStatus(key: string, status: StreamStatus, error?: unknown) {
			set((state) => {
				const stream = state.streams[key];
				if (!stream) return state;
				const nextError = status === "error" ? error : undefined;
				if (stream.status === status && Object.is(stream.error, nextError)) return state;
				return {
					streams: {
						...state.streams,
						[key]: { ...stream, status, error: nextError },
					},
				};
			});
		}

		function notifyResetListeners(key: string) {
			const stream = get().streams[key];
			if (!stream) return;
			for (const listener of stream.listeners.values()) {
				listener.onResetCache();
			}
		}

		function applyBar(key: string, bar: Bar, shouldNotify: boolean) {
			const current = get().streams[key];
			if (!current) return;

			if (!isSameBar(current.lastBar, bar) || current.status !== "active" || current.error !== undefined) {
				set((state) => {
					const stream = state.streams[key];
					if (!stream) return state;
					return {
						streams: {
							...state.streams,
							[key]: {
								...stream,
								lastBar: bar,
								status: "active",
								error: undefined,
							},
						},
					};
				});
			}

			const latest = get().streams[key];
			if (!latest) return;
			if (!shouldNotify) return;
			for (const listener of latest.listeners.values()) {
				listener.onTick(bar);
			}
		}

		function applySharedEntry(key: string, entry: SharedSubscriptionEntry | undefined) {
			const runtimeEntry = runtime.get(key);
			const nextStatus = toStreamStatus(entry?.status);
			const previousStatus = runtimeEntry?.lastStatus;
			if (runtimeEntry) {
				runtimeEntry.lastStatus = nextStatus;
			}

			if (nextStatus === "error" && previousStatus !== "error") {
				notifyResetListeners(key);
			}

			if (nextStatus === "error" || nextStatus === "connecting" || nextStatus === "idle") {
				setStreamStatus(key, nextStatus, entry?.error);
				return;
			}

			if (isBar(entry?.data)) {
				const shouldNotify = runtimeEntry?.lastData !== entry.data;
				if (runtimeEntry) {
					runtimeEntry.lastData = entry.data;
				}
				applyBar(key, entry.data, shouldNotify);
				return;
			}

			setStreamStatus(key, nextStatus, entry?.error);
		}

		function ensureRuntime(key: string, coin: string, interval: CandleInterval): StreamRuntime {
			const existing = runtime.get(key);
			if (existing) return existing;

			const sharedKey = subscriptionKey(coin, interval);
			const runtimeEntry: StreamRuntime = {
				sharedKey,
				detachSharedStore: subscriptionStore.subscribe((state) => {
					applySharedEntry(key, state.subscriptions[sharedKey]);
				}),
			};
			runtime.set(key, runtimeEntry);
			applySharedEntry(key, subscriptionStore.getState().subscriptions[sharedKey]);
			return runtimeEntry;
		}

		function acquireSharedSubscription(runtimeEntry: StreamRuntime, coin: string, interval: CandleInterval) {
			subscriptionStore.getState().acquireSubscription(
				runtimeEntry.sharedKey,
				() =>
					getSubscriptionClient().candle({ coin, interval }, (event) => {
						const bar = candleEventToBar(event);
						if (!bar) return;
						subscriptionStore.getState().setSubscriptionData(runtimeEntry.sharedKey, bar);
					}),
				CANDLE_STALENESS_THRESHOLD_MS,
				true,
			);
		}

		return {
			streams: {},
			lastBarCache: {},

			subscribe: (key, coin, interval, listenerId, onTick, onResetCache) => {
				const listener: CandleListener = { id: listenerId, onTick, onResetCache };
				let shouldAcquire = false;

				set((state) => {
					const existing = state.streams[key];
					if (existing) {
						const prevListener = existing.listeners.get(listenerId);
						if (
							prevListener &&
							prevListener.onTick === listener.onTick &&
							prevListener.onResetCache === listener.onResetCache
						) {
							return state;
						}

						const listeners = new Map(existing.listeners);
						listeners.set(listenerId, listener);
						shouldAcquire = !prevListener;
						return {
							streams: { ...state.streams, [key]: { ...existing, listeners } },
						};
					}

					shouldAcquire = true;
					const newStream: CandleStream = {
						status: "connecting",
						listeners: new Map([[listenerId, listener]]),
					};
					return { streams: { ...state.streams, [key]: newStream } };
				});

				const runtimeEntry = ensureRuntime(key, coin, interval);
				if (shouldAcquire) {
					acquireSharedSubscription(runtimeEntry, coin, interval);
				}

				const stream = get().streams[key];
				if (stream?.lastBar) {
					onTick(stream.lastBar);
				}
			},

			unsubscribe: (key, listenerId) => {
				const stream = get().streams[key];
				if (!stream || !stream.listeners.has(listenerId)) return;

				const runtimeEntry = runtime.get(key);
				const listeners = new Map(stream.listeners);
				listeners.delete(listenerId);

				if (listeners.size === 0) {
					runtimeEntry?.detachSharedStore();
					runtime.delete(key);

					set((state) => {
						const { [key]: _, ...rest } = state.streams;
						return { streams: rest };
					});
				} else {
					set((state) => ({
						streams: { ...state.streams, [key]: { ...stream, listeners } },
					}));
				}

				if (runtimeEntry) {
					subscriptionStore.getState().releaseSubscription(runtimeEntry.sharedKey);
				}
			},

			setLastBar: (cacheKey, bar) => {
				set((state) => {
					const existing = state.lastBarCache[cacheKey];
					if (isSameBar(existing, bar)) {
						cacheLru.delete(cacheKey);
						cacheLru.set(cacheKey, true);
						return state;
					}

					const nextCache = { ...state.lastBarCache, [cacheKey]: bar };
					touchCacheKey(cacheKey, nextCache);
					return { lastBarCache: nextCache };
				});
			},

			getLastBar: (cacheKey) => {
				const bar = get().lastBarCache[cacheKey];
				if (bar) {
					cacheLru.delete(cacheKey);
					cacheLru.set(cacheKey, true);
				}
				return bar;
			},
		};
	});
}

let candleStoreInstance: CandleStore | null = null;

export function getCandleStore(): CandleStore {
	if (!candleStoreInstance) {
		candleStoreInstance = createCandleStore();
	}
	return candleStoreInstance;
}

export { streamKey };
