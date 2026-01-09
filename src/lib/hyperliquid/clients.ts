import {
	ExchangeClient,
	HttpTransport,
	type HttpTransportOptions,
	InfoClient,
	type IRequestTransport,
	type ISubscriptionTransport,
	SubscriptionClient,
	WebSocketTransport,
	type WebSocketTransportOptions,
} from "@nktkas/hyperliquid";
import type { AbstractWallet } from "@nktkas/hyperliquid/signing";

const cache = new Map<string, unknown>();

function getOrCreate<T>(key: string, create: () => T): T {
	let value = cache.get(key) as T | undefined;
	if (!value) {
		value = create();
		cache.set(key, value);
	}
	return value;
}

function getHttpOptions(): HttpTransportOptions {
	const isTestnet = typeof import.meta !== "undefined" && import.meta.env?.VITE_HYPERLIQUID_TESTNET === "true";
	return { isTestnet };
}

function getWsOptions(): WebSocketTransportOptions {
	const isTestnet = typeof import.meta !== "undefined" && import.meta.env?.VITE_HYPERLIQUID_TESTNET === "true";
	return { isTestnet };
}

export function getHttpTransport(): IRequestTransport {
	return getOrCreate("http", () => new HttpTransport(getHttpOptions()));
}

export function getWsTransport(): ISubscriptionTransport {
	return getOrCreate("ws", () => new WebSocketTransport(getWsOptions()));
}

export function getInfoClient(): InfoClient {
	return getOrCreate("info", () => new InfoClient({ transport: getHttpTransport() }));
}

export function getSubscriptionClient(): SubscriptionClient {
	return getOrCreate("subscription", () => new SubscriptionClient({ transport: getWsTransport() }));
}

export function createExchangeClient(wallet: AbstractWallet): ExchangeClient {
	return new ExchangeClient({ transport: getHttpTransport(), wallet });
}

export function initializeClients(): void {
	getInfoClient();
	getSubscriptionClient();
}
