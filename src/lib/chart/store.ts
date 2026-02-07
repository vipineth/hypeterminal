import type { ISubscription } from "@nktkas/hyperliquid";
import { createStore, type StoreApi } from "zustand/vanilla";
import { getSubscriptionClient } from "@/lib/hyperliquid/clients";
import { getReconnectDelayMs, WS_RELIABILITY_LIMITS } from "@/lib/websocket/reliability";
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
	promise?: Promise<ISubscription | undefined>;
	reconnectTimer?: ReturnType<typeof setTimeout>;
	cooldownTimer?: ReturnType<typeof setTimeout>;
	reconnectAttempts: number;
	detachFailureListener?: () => void;
	coin: string;
	interval: CandleInterval;
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

const MAX_LAST_BAR_CACHE = WS_RELIABILITY_LIMITS.cache.maxChartLastBarEntries;

function streamKey(coin: string, interval: CandleInterval): string {
	return `${coin}:${interval}`;
}

function clearReconnectTimer(runtime: StreamRuntime): void {
	if (runtime.reconnectTimer) {
		clearTimeout(runtime.reconnectTimer);
		runtime.reconnectTimer = undefined;
	}
}

function clearCooldownTimer(runtime: StreamRuntime): void {
	if (runtime.cooldownTimer) {
		clearTimeout(runtime.cooldownTimer);
		runtime.cooldownTimer = undefined;
	}
}

function detachFailureListener(runtime: StreamRuntime): void {
	runtime.detachFailureListener?.();
	runtime.detachFailureListener = undefined;
}

function runUnsubscribe(subscription?: ISubscription): void {
	if (!subscription || subscription.failureSignal.aborted) return;
	void subscription.unsubscribe().catch(() => {});
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

export function createCandleStore(): CandleStore {
	const runtime = new Map<string, StreamRuntime>();
	const cacheLru = new Map<string, true>();

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

	return createStore<CandleStoreState>((set, get) => ({
		streams: {},
		lastBarCache: {},

		subscribe: (key, coin, interval, listenerId, onTick, onResetCache) => {
			const listener: CandleListener = { id: listenerId, onTick, onResetCache };

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

			let runtimeEntry = runtime.get(key);
			if (!runtimeEntry) {
				runtimeEntry = { reconnectAttempts: 0, coin, interval };
				runtime.set(key, runtimeEntry);
			} else {
				runtimeEntry.coin = coin;
				runtimeEntry.interval = interval;
			}

			clearReconnectTimer(runtimeEntry);
			clearCooldownTimer(runtimeEntry);

			const notifyReset = () => {
				const current = get().streams[key];
				if (!current) return;
				for (const entry of current.listeners.values()) {
					entry.onResetCache();
				}
			};

			const scheduleReconnect = () => {
				const runtimeEntry = runtime.get(key);
				if (!runtimeEntry || runtimeEntry.reconnectTimer || runtimeEntry.promise || runtimeEntry.subscription) {
					return;
				}

				const stream = get().streams[key];
				if (!stream || stream.listeners.size === 0) {
					return;
				}

				runtimeEntry.reconnectAttempts += 1;
				if (runtimeEntry.reconnectAttempts > WS_RELIABILITY_LIMITS.reconnect.maxAttemptsBeforeCooldown) {
					if (runtimeEntry.cooldownTimer) {
						return;
					}

					set((state) => {
						const stream = state.streams[key];
						if (!stream) return state;
						return {
							streams: {
								...state.streams,
								[key]: { ...stream, status: "error", error: new Error("Reconnect cooldown active") },
							},
						};
					});

					runtimeEntry.cooldownTimer = setTimeout(() => {
						const runtimeEntry = runtime.get(key);
						if (!runtimeEntry) return;
						runtimeEntry.cooldownTimer = undefined;
						runtimeEntry.reconnectAttempts = 0;

						const stream = get().streams[key];
						if (!stream || stream.listeners.size === 0) {
							return;
						}

						startSubscription();
					}, WS_RELIABILITY_LIMITS.reconnect.cooldownMs);
					return;
				}

				const delay = getReconnectDelayMs(runtimeEntry.reconnectAttempts);
				runtimeEntry.reconnectTimer = setTimeout(() => {
					const runtimeEntry = runtime.get(key);
					if (!runtimeEntry) return;
					runtimeEntry.reconnectTimer = undefined;

					const stream = get().streams[key];
					if (!stream || stream.listeners.size === 0) {
						return;
					}

					startSubscription();
				}, delay);
			};

			const startSubscription = () => {
				const runtimeEntry = runtime.get(key);
				if (!runtimeEntry || runtimeEntry.subscription || runtimeEntry.promise) {
					return;
				}

				const stream = get().streams[key];
				if (!stream || stream.listeners.size === 0) {
					return;
				}

				set((state) => {
					const stream = state.streams[key];
					if (!stream || stream.status === "connecting") return state;
					return {
						streams: {
							...state.streams,
							[key]: { ...stream, status: "connecting", error: undefined },
						},
					};
				});

				runtimeEntry.promise = getSubscriptionClient()
					.candle({ coin: runtimeEntry.coin, interval: runtimeEntry.interval }, (event) => {
						const bar = candleEventToBar(event);
						if (!bar) return;

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

						for (const l of current.listeners.values()) {
							l.onTick(bar);
						}
					})
					.then((subscription) => {
						const runtimeEntry = runtime.get(key);
						if (!runtimeEntry) {
							runUnsubscribe(subscription);
							return subscription;
						}

						runtimeEntry.promise = undefined;

						const stream = get().streams[key];
						if (!stream || stream.listeners.size === 0) {
							runUnsubscribe(subscription);
							runtime.delete(key);
							return subscription;
						}

						runtimeEntry.subscription = subscription;
						runtimeEntry.reconnectAttempts = 0;
						detachFailureListener(runtimeEntry);

						const onFailure = () => {
							const runtimeEntry = runtime.get(key);
							if (!runtimeEntry) return;
							runtimeEntry.subscription = undefined;
							detachFailureListener(runtimeEntry);

							const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");
							set((state) => {
								const stream = state.streams[key];
								if (!stream) return state;
								return {
									streams: {
										...state.streams,
										[key]: { ...stream, status: "error", error: reason },
									},
								};
							});

							notifyReset();
							scheduleReconnect();
						};

						subscription.failureSignal.addEventListener("abort", onFailure, { once: true });
						runtimeEntry.detachFailureListener = () => {
							subscription.failureSignal.removeEventListener("abort", onFailure);
						};

						set((state) => {
							const stream = state.streams[key];
							if (!stream) return state;
							if (stream.status === "active" && stream.error === undefined) return state;
							return {
								streams: { ...state.streams, [key]: { ...stream, status: "active", error: undefined } },
							};
						});

						return subscription;
					})
					.catch((error) => {
						const runtimeEntry = runtime.get(key);
						if (!runtimeEntry) {
							return undefined;
						}

						runtimeEntry.promise = undefined;
						runtimeEntry.subscription = undefined;
						detachFailureListener(runtimeEntry);

						set((state) => {
							const stream = state.streams[key];
							if (!stream) return state;
							return {
								streams: { ...state.streams, [key]: { ...stream, status: "error", error } },
							};
						});

						notifyReset();
						scheduleReconnect();
						return undefined;
					});
			};

			if (runtimeEntry.subscription || runtimeEntry.promise) {
				const stream = get().streams[key];
				if (stream?.lastBar) {
					onTick(stream.lastBar);
				}
				return;
			}

			startSubscription();
		},

		unsubscribe: (key, listenerId) => {
			const stream = get().streams[key];
			if (!stream || !stream.listeners.has(listenerId)) return;

			const listeners = new Map(stream.listeners);
			listeners.delete(listenerId);

			if (listeners.size === 0) {
				set((state) => {
					const { [key]: _, ...rest } = state.streams;
					return { streams: rest };
				});

				const runtimeEntry = runtime.get(key);
				if (runtimeEntry) {
					clearReconnectTimer(runtimeEntry);
					clearCooldownTimer(runtimeEntry);
					detachFailureListener(runtimeEntry);

					const subscription = runtimeEntry.subscription;
					const pending = runtimeEntry.promise;
					runtimeEntry.subscription = undefined;
					runtimeEntry.promise = undefined;

					runtime.delete(key);

					if (subscription) {
						runUnsubscribe(subscription);
					} else if (pending) {
						void pending.then((sub) => runUnsubscribe(sub)).catch(() => {});
					}
				}
			} else {
				set((state) => ({
					streams: { ...state.streams, [key]: { ...stream, listeners } },
				}));
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
