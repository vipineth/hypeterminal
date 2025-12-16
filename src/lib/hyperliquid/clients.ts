import { HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";
import { SymbolConverter } from "@nktkas/hyperliquid/utils";

const IS_TESTNET = typeof import.meta !== "undefined" && import.meta.env?.VITE_HYPERLIQUID_TESTNET === "true";

let httpTransport: HttpTransport | null = null;

export function getHttpTransport(): HttpTransport {
	if (!httpTransport) {
		httpTransport = new HttpTransport({ isTestnet: IS_TESTNET });
	}
	return httpTransport;
}

let wsTransport: WebSocketTransport | null = null;

export function getWebSocketTransport(): WebSocketTransport {
	if (!wsTransport) {
		wsTransport = new WebSocketTransport({ isTestnet: IS_TESTNET });
	}
	return wsTransport;
}

/**
 * Singleton InfoClient instance
 */
let infoClient: InfoClient | null = null;

export function getInfoClient(): InfoClient {
	if (!infoClient) {
		infoClient = new InfoClient({ transport: getHttpTransport() });
	}
	return infoClient;
}

/**
 * Singleton SubscriptionClient instance
 */
let subscriptionClient: SubscriptionClient | null = null;

export function getSubscriptionClient(): SubscriptionClient {
	if (!subscriptionClient) {
		subscriptionClient = new SubscriptionClient({
			transport: getWebSocketTransport(),
		});
	}
	return subscriptionClient;
}

/**
 * Singleton SymbolConverter instance for cached symbol↔ID conversions
 * Use getSymbolConverter() for async initialization, getSymbolConverterSync() after init
 */
let symbolConverter: SymbolConverter | null = null;
let symbolConverterPromise: Promise<SymbolConverter> | null = null;

export async function getSymbolConverter(): Promise<SymbolConverter> {
	if (symbolConverter) return symbolConverter;
	if (symbolConverterPromise) return symbolConverterPromise;

	symbolConverterPromise = SymbolConverter.create({ transport: getHttpTransport() });
	symbolConverter = await symbolConverterPromise;
	return symbolConverter;
}

/**
 * Sync access to SymbolConverter after initialization
 * Returns null if not yet initialized - call getSymbolConverter() first
 */
export function getSymbolConverterSync(): SymbolConverter | null {
	return symbolConverter;
}
