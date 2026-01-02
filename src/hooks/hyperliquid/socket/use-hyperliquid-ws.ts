import type { SubscriptionClient, WebSocketSubscription } from "@nktkas/hyperliquid";
import { useCallback, useMemo } from "react";
import { getSubscriptionClient } from "@/lib/hyperliquid/clients";
import type { HyperliquidWsEntry, HyperliquidWsStatus } from "@/stores/use-hyperliquid-ws-store";
import { useHyperliquidWsStore } from "@/stores/use-hyperliquid-ws-store";
import { useSharedSubscription } from "./use-subscription";

type SubscriptionFn = (...args: unknown[]) => Promise<WebSocketSubscription>;

export type HyperliquidWsMethodName = {
	[K in keyof SubscriptionClient]: SubscriptionClient[K] extends (...args: infer _Args) => Promise<unknown> ? K : never;
}[keyof SubscriptionClient];

/**
 * Extracts overloaded method signatures from SubscriptionClient.
 * This is gnarly, but it gives us correct parameter/return types
 * for methods like l2Book(coin, listener) vs allMids(listener).
 */

type OverloadToUnion<T> = T extends {
	(...args: infer A1): infer R1;
	(...args: infer A2): infer R2;
	(...args: infer A3): infer R3;
}
	? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3)
	: T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 }
		? ((...args: A1) => R1) | ((...args: A2) => R2)
		: T extends (...args: infer A) => infer R
			? (...args: A) => R
			: never;

type MethodUnion<K extends HyperliquidWsMethodName> = OverloadToUnion<SubscriptionClient[K]>;

type EventFromListener<L> = L extends (data: infer E) => unknown ? E : never;

type ParamTuples<K extends HyperliquidWsMethodName> = Parameters<MethodUnion<K>>;
type ListenerOnlyTuple<K extends HyperliquidWsMethodName> = Extract<ParamTuples<K>, [unknown]>;
type ParamsListenerTuple<K extends HyperliquidWsMethodName> = Extract<ParamTuples<K>, [unknown, unknown]>;

type ListenerArgFromTuple<TTuple> = TTuple extends [infer L] ? L : TTuple extends [unknown, infer L] ? L : never;

type ListenerArg<K extends HyperliquidWsMethodName> = ListenerArgFromTuple<ParamTuples<K>>;

type HasListenerOnly<K extends HyperliquidWsMethodName> = ListenerOnlyTuple<K> extends never ? false : true;

type ParamsArgFromTuple<TTuple> = TTuple extends [infer P, unknown] ? P : never;

type ParamsArg<K extends HyperliquidWsMethodName> = ParamsArgFromTuple<ParamsListenerTuple<K>>;

export type HyperliquidWsParams<K extends HyperliquidWsMethodName> = ParamsArg<K>;

export type HyperliquidWsEvent<K extends HyperliquidWsMethodName> = EventFromListener<ListenerArg<K>>;

type RequiredParamMethods = {
	[K in HyperliquidWsMethodName]: HyperliquidWsParams<K> extends never
		? never
		: HasListenerOnly<K> extends true
			? never
			: K;
}[HyperliquidWsMethodName];

type MaybeParamMethods = Exclude<HyperliquidWsMethodName, RequiredParamMethods>;

export type UseHyperliquidWsArgs<K extends HyperliquidWsMethodName, TSelected = HyperliquidWsEvent<K>> = {
	enabled?: boolean;
	clearOnUnsubscribe?: boolean;
	select?: (data: HyperliquidWsEvent<K> | undefined) => TSelected;
} & (HyperliquidWsParams<K> extends never
	? { params?: never }
	: HasListenerOnly<K> extends true
		? { params?: HyperliquidWsParams<K> }
		: { params: HyperliquidWsParams<K> });

export interface HyperliquidWsResult<TData> {
	key: string;
	data: TData | undefined;
	status: HyperliquidWsStatus;
	error?: unknown;
	failureSignal?: AbortSignal;
}

function recursiveSortObjectKeys<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map(recursiveSortObjectKeys) as T;
	}
	if (typeof value === "object" && value !== null) {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value).sort()) {
			result[key] = recursiveSortObjectKeys((value as Record<string, unknown>)[key]);
		}
		return result as T;
	}
	return value;
}

function recursiveHexToLowercase(value: unknown): unknown {
	if (typeof value === "string" && /^0[xX][0-9a-fA-F]+$/.test(value)) {
		return value.toLowerCase();
	}
	if (Array.isArray(value)) {
		return value.map(recursiveHexToLowercase);
	}
	if (typeof value === "object" && value !== null) {
		const result: Record<string, unknown> = {};
		for (const key in value) {
			result[key] = recursiveHexToLowercase((value as Record<string, unknown>)[key]);
		}
		return result;
	}
	return value;
}

function stableStringify(value: unknown): string {
	return JSON.stringify(recursiveHexToLowercase(recursiveSortObjectKeys(value)));
}

export function hyperliquidWsKey(method: string, params?: unknown): string {
	return `${method}:${stableStringify(params ?? {})}`;
}

export function useHyperliquidWs<K extends MaybeParamMethods, TSelected = HyperliquidWsEvent<K>>(
	method: K,
	args?: UseHyperliquidWsArgs<K, TSelected>,
): HyperliquidWsResult<TSelected>;
export function useHyperliquidWs<K extends RequiredParamMethods, TSelected = HyperliquidWsEvent<K>>(
	method: K,
	args: UseHyperliquidWsArgs<K, TSelected>,
): HyperliquidWsResult<TSelected>;
export function useHyperliquidWs<K extends HyperliquidWsMethodName, TSelected = HyperliquidWsEvent<K>>(
	method: K,
	args?: UseHyperliquidWsArgs<K, TSelected>,
): HyperliquidWsResult<TSelected> {
	const params = (args as UseHyperliquidWsArgs<K> | undefined)?.params;
	const enabled = args?.enabled ?? true;
	const clearOnUnsubscribe = args?.clearOnUnsubscribe ?? false;
	const select = args?.select;

	const key = useMemo(() => hyperliquidWsKey(String(method), params), [method, params]);

	const subscribeFn = useCallback(() => {
		const subscriptionClient = getSubscriptionClient();
		const storeActions = useHyperliquidWsStore.getState().actions;
		storeActions.setEntry(key, { status: "subscribing", error: undefined, failureSignal: undefined });

		const listener = (data: unknown) => {
			storeActions.setData(key, data);
		};

		const subscribe = (subscriptionClient as unknown as Record<string, SubscriptionFn>)[String(method)] as
			| SubscriptionFn
			| undefined;
		if (!subscribe) {
			const error = new Error(`Unknown Hyperliquid SubscriptionClient method: ${String(method)}`);
			storeActions.setEntry(key, { status: "error", error });
			return Promise.reject(error);
		}

		const subscriptionPromise =
			params === undefined
				? subscribe.call(subscriptionClient, listener)
				: subscribe.call(subscriptionClient, params, listener);

		subscriptionPromise
			.then((subscription) => {
				storeActions.setEntry(key, { status: "subscribed", failureSignal: subscription.failureSignal });
				subscription.failureSignal.addEventListener(
					"abort",
					() => {
						storeActions.setEntry(key, { status: "error", error: subscription.failureSignal.reason });
					},
					{ once: true },
				);
			})
			.catch((error) => {
				storeActions.setEntry(key, { status: "error", error });
				throw error;
			});

		return subscriptionPromise;
	}, [method, params, key]);

	useSharedSubscription(key, subscribeFn, {
		enabled,
		onLastUnsubscribe: () => {
			const storeActions = useHyperliquidWsStore.getState().actions;
			if (clearOnUnsubscribe) {
				storeActions.clear(key);
				return;
			}
			storeActions.setEntry(key, { status: "idle", error: undefined, failureSignal: undefined });
		},
	});

	const entry = useHyperliquidWsStore((state) => state.entries[key]) as HyperliquidWsEntry | undefined;

	const status = entry?.status ?? "idle";
	const error = entry?.error;
	const failureSignal = entry?.failureSignal;

	const rawData = entry?.data as HyperliquidWsEvent<K> | undefined;
	const data = useMemo(() => {
		if (select) return select(rawData);
		return rawData as unknown as TSelected;
	}, [rawData, select]);

	return { key, data, status, error, failureSignal };
}

export type HyperliquidWsHook<K extends HyperliquidWsMethodName> = K extends RequiredParamMethods
	? <TSelected = HyperliquidWsEvent<K>>(args: UseHyperliquidWsArgs<K, TSelected>) => HyperliquidWsResult<TSelected>
	: <TSelected = HyperliquidWsEvent<K>>(args?: UseHyperliquidWsArgs<K, TSelected>) => HyperliquidWsResult<TSelected>;

export function createHyperliquidWsHook<K extends HyperliquidWsMethodName>(method: K): HyperliquidWsHook<K> {
	return ((args?: unknown) =>
		(useHyperliquidWs as (method_: HyperliquidWsMethodName, args_?: unknown) => unknown)(
			method,
			args,
		)) as HyperliquidWsHook<K>;
}
