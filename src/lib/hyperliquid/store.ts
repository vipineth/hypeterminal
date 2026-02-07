import type { ISubscription } from "@nktkas/hyperliquid";
import { createStore, type StoreApi } from "zustand/vanilla";
import { getReconnectDelayMs, WS_RELIABILITY_LIMITS } from "@/lib/websocket/reliability";
import type { HyperliquidConfig, SubscriptionStatus, WebSocketStatus } from "./types";

export type HyperliquidStoreState = {
	config: HyperliquidConfig;
	wsStatus: WebSocketStatus;
	wsError: unknown;
	subscriptions: SubscriptionMap;
	setConfig: (config: HyperliquidConfig) => void;
	acquireSubscription: (key: string, subscribe: () => Promise<ISubscription>) => void;
	releaseSubscription: (key: string) => void;
	setSubscriptionData: (key: string, data: unknown) => void;
	setSubscriptionError: (key: string, error: unknown) => void;
};

export type HyperliquidStore = StoreApi<HyperliquidStoreState>;

type SubscriptionEntry = {
	status: SubscriptionStatus;
	data?: unknown;
	error?: unknown;
	failureSignal?: AbortSignal;
};

type SubscriptionRuntime = {
	refCount: number;
	subscription?: ISubscription;
	promise?: Promise<ISubscription | undefined>;
	reconnectTimer?: ReturnType<typeof setTimeout>;
	cooldownTimer?: ReturnType<typeof setTimeout>;
	reconnectAttempts: number;
	detachFailureListener?: () => void;
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

function detachFailureListener(runtime: SubscriptionRuntime): void {
	runtime.detachFailureListener?.();
	runtime.detachFailureListener = undefined;
}

export function createHyperliquidStore(initialConfig: HyperliquidConfig): HyperliquidStore {
	const subscriptionRuntime = new Map<string, SubscriptionRuntime>();

	return createStore<HyperliquidStoreState>((set) => ({
		config: initialConfig,
		wsStatus: "idle",
		wsError: undefined,
		subscriptions: {},
		setConfig: (config) => set({ config }),
		acquireSubscription: (key, subscribe) => {
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
				runtime = { refCount: 0, reconnectAttempts: 0 };
				subscriptionRuntime.set(key, runtime);
			}
			runtime.refCount += 1;
			clearReconnectTimer(runtime);
			clearCooldownTimer(runtime);

			set((state) => {
				const existing = state.subscriptions[key];
				if (existing && existing.status !== "error" && existing.status !== "idle") {
					return state;
				}

				const entry: SubscriptionEntry = {
					status: "subscribing",
				};

				return setSubscriptionEntry(state, key, entry);
			});

			const scheduleReconnect = () => {
				const runtime = subscriptionRuntime.get(key);
				if (!runtime || runtime.refCount <= 0 || runtime.reconnectTimer || runtime.promise || runtime.subscription) {
					return;
				}

				runtime.reconnectAttempts += 1;
				if (runtime.reconnectAttempts > WS_RELIABILITY_LIMITS.reconnect.maxAttemptsBeforeCooldown) {
					if (runtime.cooldownTimer) {
						return;
					}

					set((state) => {
						const current = state.subscriptions[key];
						if (!current) return state;
						const nextEntry: SubscriptionEntry = {
							...current,
							status: "error",
							error: new Error("Reconnect cooldown active"),
							failureSignal: undefined,
						};
						return setSubscriptionEntry(state, key, nextEntry);
					});

					runtime.cooldownTimer = setTimeout(() => {
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

				const delay = getReconnectDelayMs(runtime.reconnectAttempts);
				runtime.reconnectTimer = setTimeout(() => {
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

			const startSubscription = () => {
				const runtime = subscriptionRuntime.get(key);
				if (!runtime || runtime.refCount <= 0 || runtime.promise || runtime.subscription) return;

				runtime.promise = subscribe()
					.then((subscription) => {
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

						runtime.subscription = subscription;
						runtime.reconnectAttempts = 0;
						detachFailureListener(runtime);

						const onFailure = () => {
							const runtime = subscriptionRuntime.get(key);
							if (!runtime) return;
							runtime.subscription = undefined;
							detachFailureListener(runtime);

							const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");
							set((state) => {
								const current = state.subscriptions[key];
								if (!current) return state;
								const nextEntry: SubscriptionEntry = {
									...current,
									status: "error",
									error: reason,
									failureSignal: undefined,
								};
								return setSubscriptionEntry(state, key, nextEntry);
							});

							scheduleReconnect();
						};

						subscription.failureSignal.addEventListener("abort", onFailure, { once: true });
						runtime.detachFailureListener = () => {
							subscription.failureSignal.removeEventListener("abort", onFailure);
						};

						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							if (
								current.status === "active" &&
								current.error === undefined &&
								current.failureSignal === subscription.failureSignal
							) {
								return state;
							}
							const nextEntry: SubscriptionEntry = {
								...current,
								status: "active",
								error: undefined,
								failureSignal: subscription.failureSignal,
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
						detachFailureListener(runtime);

						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							const nextEntry: SubscriptionEntry = {
								...current,
								status: "error",
								error,
								failureSignal: undefined,
							};
							return setSubscriptionEntry(state, key, nextEntry);
						});

						scheduleReconnect();
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
			detachFailureListener(runtime);

			set((state) => {
				if (!state.subscriptions[key]) return state;
				const nextSubscriptions: SubscriptionMap = { ...state.subscriptions };
				delete nextSubscriptions[key];
				return { subscriptions: nextSubscriptions, ...deriveWsState(nextSubscriptions) };
			});

			subscriptionRuntime.delete(key);
			const subscription = runtime.subscription;
			const pending = runtime.promise;
			runtime.subscription = undefined;
			runtime.promise = undefined;

			const runUnsubscribe = async (subscription?: ISubscription) => {
				if (!subscription || subscription.failureSignal.aborted) return;
				await subscription.unsubscribe().catch(() => {});
			};

			if (subscription) {
				void runUnsubscribe(subscription);
			} else if (pending) {
				void pending.then(runUnsubscribe).catch(() => {});
			}
		},
		setSubscriptionData: (key, data) => {
			set((state) => {
				const current = state.subscriptions[key];
				if (!current) return state;
				if (current.status === "active" && current.error === undefined && Object.is(current.data, data)) {
					return state;
				}
				const nextEntry: SubscriptionEntry = {
					...current,
					data,
					status: "active",
					error: undefined,
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
}
