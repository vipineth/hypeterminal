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
import type { PrivateKeyAccount } from "viem/accounts";
import { getSdkReconnectionDelayMs } from "./internal/websocket/reliability";
import { LRU } from "./lru";
import { createL1AgentWallet } from "./signing/l1-agent-wallet";

const cache = new Map<string, unknown>();

function getOrCreate<T>(key: string, create: () => T): T {
	let value = cache.get(key) as T | undefined;
	if (!value) {
		value = create();
		cache.set(key, value);
	}
	return value;
}

/** @internal — exported only for tests; do not consume from outside this package. */
export const tradingClientCache = new LRU<string, ExchangeClient>(4);

function getHttpOptions(isTestnet: boolean): HttpTransportOptions {
	return { isTestnet };
}

function getWsOptions(isTestnet: boolean): WebSocketTransportOptions {
	return {
		isTestnet,
		reconnect: {
			maxRetries: Infinity,
			connectionTimeout: 10_000,
			reconnectionDelay: getSdkReconnectionDelayMs,
		},
	};
}

export function getHttpTransport(isTestnet: boolean): IRequestTransport {
	return getOrCreate(`http:${isTestnet}`, () => new HttpTransport(getHttpOptions(isTestnet)));
}

export function getWsTransport(isTestnet: boolean): ISubscriptionTransport {
	return getOrCreate(`ws:${isTestnet}`, () => new WebSocketTransport(getWsOptions(isTestnet)));
}

// `socket.reconnect()` drops the connection without terminating it, so the SDK
// re-runs resubscribe on the next open. `close()` would terminate permanently.
// Guarded by an instanceof check so non-WS transports (e.g. in-memory fakes used
// in tests) cleanly return a no-op.
export function createWsReconnectTrigger(isTestnet: boolean): () => void {
	const transport = getWsTransport(isTestnet);
	if (!(transport instanceof WebSocketTransport)) return () => {};
	const socket = transport.socket;
	return () => socket.reconnect();
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

export function createExchangeClient(wallet: AbstractWallet, isTestnet: boolean, cacheKey?: string): ExchangeClient {
	if (cacheKey) {
		const cached = tradingClientCache.get(cacheKey);
		if (cached) return cached;
	}
	const client = new ExchangeClient({ transport: getHttpTransport(isTestnet), wallet });
	if (cacheKey) {
		tradingClientCache.set(cacheKey, client);
	}
	return client;
}

function isPrivateKeyAccount(wallet: AbstractWallet): wallet is PrivateKeyAccount {
	return "sign" in wallet && typeof (wallet as Record<string, unknown>).sign === "function";
}

export function getTradingClient(wallet: AbstractWallet & { address: string }, isTestnet: boolean): ExchangeClient {
	return getOrCreate(`trading:${wallet.address.toLowerCase()}:${isTestnet}`, () => {
		const signingWallet = isPrivateKeyAccount(wallet) ? createL1AgentWallet(wallet) : wallet;
		return new ExchangeClient({ transport: getHttpTransport(isTestnet), wallet: signingWallet });
	});
}

export function initializeClients(isTestnet: boolean): void {
	getInfoClient(isTestnet);
	getSubscriptionClient(isTestnet);
}
