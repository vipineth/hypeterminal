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

function getHttpOptions(isTestnet: boolean): HttpTransportOptions {
	return { isTestnet };
}

function getWsOptions(isTestnet: boolean): WebSocketTransportOptions {
	return { isTestnet };
}

export function getHttpTransport(isTestnet: boolean): IRequestTransport {
	return getOrCreate(`http:${isTestnet}`, () => new HttpTransport(getHttpOptions(isTestnet)));
}

export function getWsTransport(isTestnet: boolean): ISubscriptionTransport {
	return getOrCreate(`ws:${isTestnet}`, () => new WebSocketTransport(getWsOptions(isTestnet)));
}

export function getInfoClient(isTestnet: boolean): InfoClient {
	return getOrCreate(`info:${isTestnet}`, () => new InfoClient({ transport: getHttpTransport(isTestnet) }));
}

export function getSubscriptionClient(isTestnet: boolean): SubscriptionClient {
	return getOrCreate(
		`subscription:${isTestnet}`,
		() => new SubscriptionClient({ transport: getWsTransport(isTestnet) }),
	);
}

export function createExchangeClient(wallet: AbstractWallet, isTestnet: boolean): ExchangeClient {
	return new ExchangeClient({ transport: getHttpTransport(isTestnet), wallet });
}

export function initializeClients(isTestnet: boolean): void {
	getInfoClient(isTestnet);
	getSubscriptionClient(isTestnet);
}
