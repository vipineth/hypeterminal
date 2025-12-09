import { HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from "@nktkas/hyperliquid";

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

// Re-export types from SDK for convenience
export type {
	HttpTransport,
	InfoClient,
	SubscriptionClient,
	WebSocketTransport,
} from "@nktkas/hyperliquid";
