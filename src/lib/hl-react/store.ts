import type { ISubscription } from "@nktkas/hyperliquid";
import { createStore, type StoreApi } from "zustand/vanilla";
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
	promise?: Promise<ISubscription>;
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
				runtime = { refCount: 0 };
				subscriptionRuntime.set(key, runtime);
			}
			runtime.refCount += 1;

			set((state) => {
				const existing = state.subscriptions[key];
				if (existing) {
					return state;
				}

				const entry: SubscriptionEntry = {
					status: "subscribing",
				};

				return setSubscriptionEntry(state, key, entry);
			});

			const startSubscription = () => {
				const runtime = subscriptionRuntime.get(key);
				if (!runtime || runtime.promise || runtime.subscription) return;

				runtime.promise = subscribe()
					.then((subscription) => {
						runtime.subscription = subscription;
						runtime.promise = undefined;

						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							const nextEntry: SubscriptionEntry = {
								...current,
								status: "active",
								error: undefined,
								failureSignal: subscription.failureSignal,
							};
							return setSubscriptionEntry(state, key, nextEntry);
						});

						subscription.failureSignal.addEventListener(
							"abort",
							() => {
								const reason = subscription.failureSignal.reason ?? new Error("Subscription failed");
								set((state) => {
									const current = state.subscriptions[key];
									if (!current) return state;
									const nextEntry: SubscriptionEntry = { ...current, status: "error", error: reason };
									return setSubscriptionEntry(state, key, nextEntry);
								});
							},
							{ once: true },
						);

						return subscription;
					})
					.catch((error) => {
						runtime.promise = undefined;
						set((state) => {
							const current = state.subscriptions[key];
							if (!current) return state;
							const nextEntry: SubscriptionEntry = { ...current, status: "error", error };
							return setSubscriptionEntry(state, key, nextEntry);
						});
						throw error;
					});
			};

			startSubscription();
		},
		releaseSubscription: (key) => {
			const runtime = subscriptionRuntime.get(key);
			if (!runtime) {
				return;
			}

			runtime.refCount -= 1;
			if (runtime.refCount > 0) {
				return;
			}

			set((state) => {
				if (!state.subscriptions[key]) return state;
				const nextSubscriptions: SubscriptionMap = { ...state.subscriptions };
				delete nextSubscriptions[key];
				return { subscriptions: nextSubscriptions, ...deriveWsState(nextSubscriptions) };
			});

			subscriptionRuntime.delete(key);

			const runUnsubscribe = async (subscription?: ISubscription) => {
				if (!subscription) return;
				await subscription.unsubscribe();
			};

			if (runtime.subscription) {
				void runUnsubscribe(runtime.subscription);
			} else if (runtime.promise) {
				runtime.promise.then(runUnsubscribe).catch(() => {});
			}
		},
		setSubscriptionData: (key, data) => {
			set((state) => {
				const current = state.subscriptions[key];
				if (!current) return state;
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
