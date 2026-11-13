import type { ISubscription } from "@nktkas/hyperliquid";
import { createStore, type StoreApi } from "zustand/vanilla";
import { subscribeNetworkStatus } from "./internal/websocket/network-status";
import {
	forgetParsedKey,
	getReconnectDelayMs,
	getStalenessThresholdForKey,
	isUserStreamKey,
	WS_RELIABILITY_LIMITS,
} from "./internal/websocket/reliability";
import { createStalenessWatchdog, type StalenessWatchdog } from "./internal/websocket/staleness";
import { getVisibilityState, subscribeVisibility } from "./internal/websocket/visibility";
import type { HyperliquidConfig, SubscriptionStatus, WebSocketStatus } from "./types";

export type HyperliquidStoreState = {
	config: HyperliquidConfig;
	wsStatus: WebSocketStatus;
	wsError: unknown;
	subscriptions: SubscriptionMap;
	setConfig: (config: HyperliquidConfig) => void;
	acquireSubscription: (
		key: string,
		subscribe: (onError: (error: unknown) => void) => Promise<ISubscription>,
		stalenessThresholdMs?: number,
		pauseWhenHidden?: boolean,
	) => void;
	releaseSubscription: (key: string) => void;
	setSubscriptionData: (key: string, data: unknown) => void;
	setSubscriptionError: (key: string, error: unknown) => void;
};

export type HyperliquidStore = StoreApi<HyperliquidStoreState>;

type SubscriptionEntry = {
	status: SubscriptionStatus;
	data?: unknown;
	error?: unknown;
	isStale?: boolean;
};

export type SubscriptionRuntime = {
	refCount: number;
	subscription?: ISubscription;
	promise?: Promise<ISubscription | undefined>;
	reconnectTimer?: ReturnType<typeof setTimeout>;
	cooldownTimer?: ReturnType<typeof setTimeout>;
	reconnectAttempts: number;
	detachStaleness?: () => void;
	pauseWhenHidden?: boolean;
};

type SubscriptionMap = Record<string, SubscriptionEntry>;

type WsState = Pick<HyperliquidStoreState, "wsStatus" | "wsError">;

function deriveWsState(subscriptions: SubscriptionMap): WsState {
	const entries = Object.values(subscriptions);
	if (entries.length === 0) {
		return { wsStatus: "idle" as const, wsError: undefined };
	}
	if (entries.some((entry) => entry.status === "active")) {
		return { wsStatus: "open" as const, wsError: undefined };
	}
	if (entries.some((entry) => entry.status === "subscribing")) {
		return { wsStatus: "connecting" as const, wsError: undefined };
	}
	const errorEntry = entries.find((entry) => entry.status === "error");
	if (errorEntry) {
		return { wsStatus: "error" as const, wsError: errorEntry.error };
	}
	return { wsStatus: "idle" as const, wsError: undefined };
}

function setSubscriptionEntry(
	state: HyperliquidStoreState,
	key: string,
	entry: SubscriptionEntry,
): Pick<HyperliquidStoreState, "subscriptions" | "wsStatus" | "wsError"> {
	const nextSubscriptions: SubscriptionMap = { ...state.subscriptions, [key]: entry };
	return { subscriptions: nextSubscriptions, ...deriveWsState(nextSubscriptions) };
}

function clearReconnectTimer(runtime: SubscriptionRuntime): void {
	if (runtime.reconnectTimer) {
		clearTimeout(runtime.reconnectTimer);
		runtime.reconnectTimer = undefined;
	}
}

function clearCooldownTimer(runtime: SubscriptionRuntime): void {
	if (runtime.cooldownTimer) {
		clearTimeout(runtime.cooldownTimer);
		runtime.cooldownTimer = undefined;
	}
}

export function createHyperliquidStore(initialConfig: HyperliquidConfig): HyperliquidStore {
	const subscriptionRuntime = new Map<string, SubscriptionRuntime>();
	const watchdog: StalenessWatchdog = createStalenessWatchdog(WS_RELIABILITY_LIMITS.staleness.checkIntervalMs);
	const visibilityBuffer = new Map<string, unknown>();
	let singletonsAttached = false;
	let detachVisibility: (() => void) | undefined;
	let detachNetwork: (() => void) | undefined;
	let detachSocketClose: (() => void) | undefined;
	let wasHidden = false;
	let wasOffline = false;

	function shouldPauseKey(key: string): boolean {
		const runtime = subscriptionRuntime.get(key);
		if (runtime?.pauseWhenHidden !== undefined) return runtime.pauseWhenHidden;
		return !isUserStreamKey(key);
	}

	function flushVisibilityBuffer(store: StoreApi<HyperliquidStoreState>) {
		if (visibilityBuffer.size === 0) return;
		for (const [key, data] of visibilityBuffer) {
			store.setState((state) => {
				const current = state.subscriptions[key];
				if (!current) return state;
				return setSubscriptionEntry(state, key, { ...current, data, status: "active", error: undefined });
			});
		}
		visibilityBuffer.clear();
	}

	function markAllStale(store: StoreApi<HyperliquidStoreState>) {
		store.setState((state) => {
			const subscriptions: SubscriptionMap = {};
			for (const [key, entry] of Object.entries(state.subscriptions)) {
				subscriptions[key] = entry.isStale ? entry : { ...entry, isStale: true };
			}
			return { subscriptions };
		});
	}

	function attachSingletons(config: HyperliquidConfig, store: StoreApi<HyperliquidStoreState>) {
		detachSocketClose ??= config.subscribeSocketClose?.(() => markAllStale(store));
		if (singletonsAttached) return;
		const { triggerReconnect } = config;
		if (!triggerReconnect) return;
		singletonsAttached = true;

		detachVisibility = subscribeVisibility((state) => {
			if (state === "hidden") {
				wasHidden = true;
			} else if (wasHidden) {
				wasHidden = false;
				flushVisibilityBuffer(store);
				triggerReconnect();
			}
		});

		detachNetwork = subscribeNetworkStatus((state) => {
			if (state === "offline") {
				wasOffline = true;
			} else if (wasOffline) {
				wasOffline = false;
				triggerReconnect();
			}
		});
	}

	function detachSingletons() {
		detachSocketClose?.();
		detachSocketClose = undefined;
		if (!singletonsAttached) return;
		singletonsAttached = false;
		detachVisibility?.();
		detachVisibility = undefined;
		detachNetwork?.();
		detachNetwork = undefined;
		wasHidden = false;
		wasOffline = false;
		visibilityBuffer.clear();
	}

	const store = createStore<HyperliquidStoreState>((set, get) => ({
		config: initialConfig,
		wsStatus: "idle",
		wsError: undefined,
		subscriptions: {},
		setConfig: (config) => set({ config }),
		acquireSubscription: (key, subscribe, stalenessThresholdMs?, pauseWhenHidden?) => {
			// `store` below is a deferred (TDZ-safe) reference: zustand calls
			// this factory synchronously but acquireSubscription only runs after
			// createStore returns, so `store` is already assigned by then.
			if (import.meta.env.DEV && pauseWhenHidden && !get().config.triggerReconnect) {
				console.warn(
					"[hl-react] acquireSubscription: pauseWhenHidden has no effect without config.triggerReconnect. " +
						"Visibility-buffered values will never be flushed because no reconnect can happen on resume.",
				);
			}
			attachSingletons(get().config, store);

			let runtime = subscriptionRuntime.get(key);
			if (!runtime) {
				if (subscriptionRuntime.size >= WS_RELIABILITY_LIMITS.subscriptions.maxTrackedKeys) {
					set((state) => {
						const entry: SubscriptionEntry = {
							status: "error",
							error: new Error("Subscription limit reached"),
						};
						return setSubscriptionEntry(state, key, entry);
					});
					return;
				}
				runtime = { refCount: 0, reconnectAttempts: 0, pauseWhenHidden };
				subscriptionRuntime.set(key, runtime);

				const threshold = stalenessThresholdMs ?? getStalenessThresholdForKey(key);
				watchdog.register(key, threshold);
				runtime.detachStaleness = watchdog.subscribe(key, (stale) => {
					if (!stale) return;
					set((state) => {
						const current = state.subscriptions[key];
						if (!current || current.isStale) return state;
						return setSubscriptionEntry(state, key, { ...current, isStale: true });
					});
					get().config.triggerReconnect?.();
				});
			} else if (pauseWhenHidden === false) {
				runtime.pauseWhenHidden = false;
				if (visibilityBuffer.has(key)) {
					const buffered = visibilityBuffer.get(key);
					visibilityBuffer.delete(key);
					set((state) => {
						const current = state.subscriptions[key];
						if (!current) return state;
						return setSubscriptionEntry(state, key, { ...current, data: buffered });
					});
				}
			}
			runtime.refCount += 1;
			clearReconnectTimer(runtime);
			clearCooldownTimer(runtime);

			set((state) => {
				const existing = state.subscriptions[key];
				if (existing && existing.status !== "error" && existing.status !== "idle") {
					return state;
				}

				visibilityBuffer.delete(key);
				const entry: SubscriptionEntry = {
					status: "subscribing",
				};

				return setSubscriptionEntry(state, key, entry);
			});

			const scheduleReconnect = () => {
				const currentRuntime = subscriptionRuntime.get(key);
				if (
					!currentRuntime ||
					currentRuntime.refCount <= 0 ||
					currentRuntime.reconnectTimer ||
					currentRuntime.promise ||
					currentRuntime.subscription
				) {
					return;
				}

				currentRuntime.reconnectAttempts += 1;
				if (currentRuntime.reconnectAttempts > WS_RELIABILITY_LIMITS.reconnect.maxAttemptsBeforeCooldown) {
					if (currentRuntime.cooldownTimer) {
						return;
					}

					set((state) => {
						const current = state.subscriptions[key];
						if (!current) return state;
						const nextEntry: SubscriptionEntry = {
							...current,
							status: "error",
							error: new Error("Reconnect cooldown active"),
						};
						return setSubscriptionEntry(state, key, nextEntry);
					});

					currentRuntime.cooldownTimer = setTimeout(() => {
						const runtime = subscriptionRuntime.get(key);
						if (!runtime) return;
						runtime.cooldownTimer = undefined;
						runtime.reconnectAttempts = 0;
						if (runtime.refCount <= 0) return;

						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							const nextEntry: SubscriptionEntry = {
								...current,
								status: "subscribing",
								error: undefined,
							};
							return setSubscriptionEntry(state, key, nextEntry);
						});

						startSubscription();
					}, WS_RELIABILITY_LIMITS.reconnect.cooldownMs);
					return;
				}

				const delay = getReconnectDelayMs(currentRuntime.reconnectAttempts);
				currentRuntime.reconnectTimer = setTimeout(() => {
					const runtime = subscriptionRuntime.get(key);
					if (!runtime) return;
					runtime.reconnectTimer = undefined;
					if (runtime.refCount <= 0) return;

					set((state) => {
						const current = state.subscriptions[key];
						if (!current) return state;
						const nextEntry: SubscriptionEntry = {
							...current,
							status: "subscribing",
							error: undefined,
						};
						return setSubscriptionEntry(state, key, nextEntry);
					});

					startSubscription();
				}, delay);
			};

			const failSubscription = (error: unknown) => {
				set((state) => {
					const current = state.subscriptions[key];
					if (!current) return state;
					const nextEntry: SubscriptionEntry = {
						...current,
						status: "error",
						error,
					};
					return setSubscriptionEntry(state, key, nextEntry);
				});
				scheduleReconnect();
			};

			const startSubscription = () => {
				const runtime = subscriptionRuntime.get(key);
				if (!runtime || runtime.refCount <= 0 || runtime.promise || runtime.subscription) return;

				const attempt: { failure?: { error: unknown }; subscription?: ISubscription } = {};
				const onError = (error: unknown) => {
					attempt.failure = { error };
					const runtime = subscriptionRuntime.get(key);
					if (!runtime || !attempt.subscription || runtime.subscription !== attempt.subscription) return;
					runtime.subscription = undefined;
					failSubscription(error);
				};

				runtime.promise = subscribe(onError)
					.then((subscription) => {
						attempt.subscription = subscription;
						const runtime = subscriptionRuntime.get(key);
						if (!runtime) {
							void subscription.unsubscribe().catch(() => {});
							return subscription;
						}

						runtime.promise = undefined;

						if (runtime.refCount <= 0) {
							void subscription.unsubscribe().catch(() => {});
							return subscription;
						}

						if (attempt.failure) {
							failSubscription(attempt.failure.error);
							return undefined;
						}

						runtime.subscription = subscription;
						runtime.reconnectAttempts = 0;

						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							if (current.status === "active" && current.error === undefined) {
								return state;
							}
							const nextEntry: SubscriptionEntry = {
								...current,
								status: "active",
								error: undefined,
							};
							return setSubscriptionEntry(state, key, nextEntry);
						});

						return subscription;
					})
					.catch((error) => {
						const runtime = subscriptionRuntime.get(key);
						if (!runtime) {
							return undefined;
						}

						runtime.promise = undefined;
						runtime.subscription = undefined;
						failSubscription(error);
						return undefined;
					});
			};

			startSubscription();
		},
		releaseSubscription: (key) => {
			const runtime = subscriptionRuntime.get(key);
			if (!runtime) {
				return;
			}

			runtime.refCount = Math.max(0, runtime.refCount - 1);
			if (runtime.refCount > 0) {
				return;
			}

			clearReconnectTimer(runtime);
			clearCooldownTimer(runtime);
			runtime.detachStaleness?.();
			watchdog.unregister(key);

			set((state) => {
				if (!state.subscriptions[key]) return state;
				const nextSubscriptions: SubscriptionMap = { ...state.subscriptions };
				delete nextSubscriptions[key];
				return { subscriptions: nextSubscriptions, ...deriveWsState(nextSubscriptions) };
			});

			visibilityBuffer.delete(key);
			subscriptionRuntime.delete(key);
			forgetParsedKey(key);
			if (subscriptionRuntime.size === 0) {
				detachSingletons();
			}

			const subscription = runtime.subscription;
			const pending = runtime.promise;
			runtime.subscription = undefined;
			runtime.promise = undefined;

			const runUnsubscribe = async (subscription?: ISubscription) => {
				if (!subscription) return;
				await subscription.unsubscribe().catch(() => {});
			};

			if (subscription) {
				void runUnsubscribe(subscription);
			} else if (pending) {
				void pending.then(runUnsubscribe).catch(() => {});
			}
		},
		setSubscriptionData: (key, data) => {
			watchdog.markFresh(key);
			if (getVisibilityState() === "hidden" && shouldPauseKey(key)) {
				visibilityBuffer.set(key, data);
				return;
			}
			set((state) => {
				const current = state.subscriptions[key];
				if (!current) return state;
				if (
					current.status === "active" &&
					current.error === undefined &&
					!current.isStale &&
					Object.is(current.data, data)
				) {
					return state;
				}
				const nextEntry: SubscriptionEntry = {
					...current,
					data,
					status: "active",
					error: undefined,
					isStale: false,
				};
				return setSubscriptionEntry(state, key, nextEntry);
			});
		},
		setSubscriptionError: (key, error) => {
			set((state) => {
				const current = state.subscriptions[key];
				if (!current) return state;
				const nextEntry: SubscriptionEntry = { ...current, error, status: "error" };
				return setSubscriptionEntry(state, key, nextEntry);
			});
		},
	}));

	return store;
}
