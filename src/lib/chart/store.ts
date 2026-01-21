import type { ISubscription } from "@nktkas/hyperliquid";
import { createStore, type StoreApi } from "zustand/vanilla";
import { getSubscriptionClient } from "@/lib/hyperliquid/clients";
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
	subscription?: ISubscription;
	promise?: Promise<ISubscription>;
};

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

function streamKey(coin: string, interval: CandleInterval): string {
	return `${coin}:${interval}`;
}

export function createCandleStore(): CandleStore {
	const runtime = new Map<string, StreamRuntime>();

	return createStore<CandleStoreState>((set, get) => ({
		streams: {},
		lastBarCache: {},

		subscribe: (key, coin, interval, listenerId, onTick, onResetCache) => {
			const listener: CandleListener = { id: listenerId, onTick, onResetCache };

			set((state) => {
				const existing = state.streams[key];
				if (existing) {
					const listeners = new Map(existing.listeners);
					listeners.set(listenerId, listener);
					return {
						streams: { ...state.streams, [key]: { ...existing, listeners } },
					};
				}

				const newStream: CandleStream = {
					status: "connecting",
					listeners: new Map([[listenerId, listener]]),
				};
				return { streams: { ...state.streams, [key]: newStream } };
			});

			let rt = runtime.get(key);
			if (rt?.subscription || rt?.promise) {
				const stream = get().streams[key];
				if (stream?.lastBar) {
					onTick(stream.lastBar);
				}
				return;
			}

			if (!rt) {
				rt = {};
				runtime.set(key, rt);
			}

			rt.promise = getSubscriptionClient()
				.candle({ coin, interval }, (event) => {
					const bar = candleEventToBar(event);
					if (!bar) return;

					const current = get().streams[key];
					if (!current) return;

					set((state) => {
						const stream = state.streams[key];
						if (!stream) return state;
						return {
							streams: { ...state.streams, [key]: { ...stream, lastBar: bar, status: "active" } },
						};
					});

					for (const l of current.listeners.values()) {
						l.onTick(bar);
					}
				})
				.then((subscription) => {
					const rt = runtime.get(key);
					if (rt) {
						rt.subscription = subscription;
						rt.promise = undefined;
					}

					set((state) => {
						const stream = state.streams[key];
						if (!stream) return state;
						return {
							streams: { ...state.streams, [key]: { ...stream, status: "active", error: undefined } },
						};
					});

					subscription.failureSignal.addEventListener(
						"abort",
						() => {
							const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");

							set((state) => {
								const stream = state.streams[key];
								if (!stream) return state;
								return {
									streams: { ...state.streams, [key]: { ...stream, status: "error", error: reason } },
								};
							});

							const current = get().streams[key];
							if (current) {
								for (const l of current.listeners.values()) {
									l.onResetCache();
								}
							}

							const rt = runtime.get(key);
							if (rt) {
								rt.subscription = undefined;
								rt.promise = undefined;
							}
						},
						{ once: true },
					);

					return subscription;
				})
				.catch((error) => {
					const rt = runtime.get(key);
					if (rt) {
						rt.promise = undefined;
					}

					set((state) => {
						const stream = state.streams[key];
						if (!stream) return state;
						return {
							streams: { ...state.streams, [key]: { ...stream, status: "error", error } },
						};
					});

					const current = get().streams[key];
					if (current) {
						for (const l of current.listeners.values()) {
							l.onResetCache();
						}
					}

					throw error;
				});
		},

		unsubscribe: (key, listenerId) => {
			const state = get();
			const stream = state.streams[key];
			if (!stream) return;

			const listeners = new Map(stream.listeners);
			listeners.delete(listenerId);

			if (listeners.size === 0) {
				set((s) => {
					const { [key]: _, ...rest } = s.streams;
					return { streams: rest };
				});

				const rt = runtime.get(key);
				if (rt) {
					if (rt.subscription) {
						rt.subscription.unsubscribe().catch(() => {});
					} else if (rt.promise) {
						rt.promise.then((sub) => sub.unsubscribe()).catch(() => {});
					}
					runtime.delete(key);
				}
			} else {
				set((s) => ({
					streams: { ...s.streams, [key]: { ...stream, listeners } },
				}));
			}
		},

		setLastBar: (cacheKey, bar) => {
			set((state) => ({
				lastBarCache: { ...state.lastBarCache, [cacheKey]: bar },
			}));
		},

		getLastBar: (cacheKey) => {
			return get().lastBarCache[cacheKey];
		},
	}));
}

let candleStoreInstance: CandleStore | null = null;

export function getCandleStore(): CandleStore {
	if (!candleStoreInstance) {
		candleStoreInstance = createCandleStore();
	}
	return candleStoreInstance;
}

export { streamKey };
