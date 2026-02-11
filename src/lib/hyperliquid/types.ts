import type { HyperliquidError, IRequestTransport, ISubscriptionTransport } from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import type { QueryKey, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";

export type HyperliquidQueryError = HyperliquidError;

export type QueryParameter<TQueryFnData, TData = TQueryFnData> = Omit<
	UseQueryOptions<TQueryFnData, HyperliquidQueryError, TData, QueryKey>,
	"queryKey" | "queryFn"
>;

export type MutationParameter<TData, TVariables> = Omit<
	UseMutationOptions<TData, HyperliquidQueryError, TVariables>,
	"mutationKey" | "mutationFn"
>;

type AnyMethod = (...args: unknown[]) => unknown;

export type InferData<TMethod extends AnyMethod> = Awaited<ReturnType<TMethod>>;
export type InferParams<TMethod extends AnyMethod> = Exclude<Parameters<TMethod>[0], AbortSignal>;
export type InferSubListener<TMethod extends AnyMethod> = Extract<Parameters<TMethod>[number], (data: unknown) => void>;
export type InferSubEvent<TMethod extends AnyMethod> = InferSubListener<TMethod> extends (data: infer D) => void
	? D
	: never;
export type InferSubParams<TMethod extends AnyMethod> = Exclude<Parameters<TMethod>[0], InferSubListener<TMethod>>;

export type SubscriptionStatus = "idle" | "subscribing" | "active" | "error";
export type WebSocketStatus = "idle" | "connecting" | "open" | "error";

export interface SubscriptionOptions {
	enabled?: boolean;
	throttleMs?: number;
	maxPayloadBytes?: number;
	dropOversizedPayload?: boolean;
}

export type SubscriptionResult<TData> = {
	data: TData | undefined;
	status: SubscriptionStatus;
	error: unknown;
	unsubscribe: (() => Promise<void>) | undefined;
	failureSignal: AbortSignal | undefined;
};

export type HyperliquidConfig = {
	httpTransport?: IRequestTransport;
	wsTransport?: ISubscriptionTransport;
	wallet?: AbstractWallet;
	ssr?: boolean;
};

export type HyperliquidProviderProps = {
	children: ReactNode;
	env: HyperliquidEnv;
	userAddress: `0x${string}` | undefined;
	wallet: AbstractWallet | undefined;
	agentName?: string;
	builderConfig?: BuilderConfig;
	httpTransport?: IRequestTransport;
	wsTransport?: ISubscriptionTransport;
};
