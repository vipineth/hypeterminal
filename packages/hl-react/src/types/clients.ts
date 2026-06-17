import type { ExchangeClient, InfoClient, ISubscription, SubscriptionClient } from "@nktkas/hyperliquid";

// ── InfoClient mapped types ─────────────────────────────────────────

type InfoClientMethods = {
	[K in keyof InfoClient as InfoClient[K] extends (...args: never[]) => Promise<unknown> ? K : never]: InfoClient[K];
};

export type InfoMethod = keyof InfoClientMethods & string;

export type InfoParams<M extends InfoMethod> = InfoClientMethods[M] extends {
	(params: infer P, signal?: AbortSignal): Promise<unknown>;
	(signal?: AbortSignal): Promise<unknown>;
}
	? P | undefined
	: InfoClientMethods[M] extends (params: infer P, signal?: AbortSignal) => Promise<unknown>
		? P extends AbortSignal | undefined
			? undefined
			: P
		: undefined;

export type InfoResponse<M extends InfoMethod> = InfoClientMethods[M] extends (...args: never[]) => Promise<infer R>
	? R
	: never;

// ── ExchangeClient mapped types ─────────────────────────────────────

type ExchangeClientMethods = {
	[K in keyof ExchangeClient as ExchangeClient[K] extends (...args: never[]) => Promise<unknown>
		? K
		: never]: ExchangeClient[K];
};

export type ExchangeMethod = keyof ExchangeClientMethods & string;

export type ExchangeParams<M extends ExchangeMethod> = ExchangeClientMethods[M] extends {
	(params: infer P, ...args: never[]): Promise<unknown>;
	(...args: never[]): Promise<unknown>;
}
	? P | undefined
	: ExchangeClientMethods[M] extends (params: infer P, ...args: never[]) => Promise<unknown>
		? P
		: ExchangeClientMethods[M] extends (...args: never[]) => Promise<unknown>
			? undefined
			: never;

export type ExchangeResponse<M extends ExchangeMethod> = ExchangeClientMethods[M] extends (
	...args: never[]
) => Promise<infer R>
	? R
	: never;

// ── SubscriptionClient mapped types ─────────────────────────────────

type SubClientMethods = {
	[K in keyof SubscriptionClient as SubscriptionClient[K] extends (...args: never[]) => Promise<ISubscription>
		? K
		: never]: SubscriptionClient[K];
};

export type SubMethod = keyof SubClientMethods & string;

type SubOptionalParamsMethods = "allMids" | "assetCtxs";

type LastParam<T extends (...args: never[]) => unknown> = Parameters<T> extends [...infer _Rest, infer L] ? L : never;

export type SubParams<M extends SubMethod> = M extends SubOptionalParamsMethods
	? Parameters<SubClientMethods[M]> extends [infer P, unknown]
		? P | undefined
		: undefined
	: Parameters<SubClientMethods[M]> extends [infer P, unknown]
		? P
		: undefined;

export type SubEvent<M extends SubMethod> = LastParam<SubClientMethods[M]> extends (data: infer E) => void ? E : never;
