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

export type ClientRegistryConfig = {
	httpTransport?: IRequestTransport;
	wsTransport?: ISubscriptionTransport;
	httpTransportOptions?: HttpTransportOptions;
	wsTransportOptions?: WebSocketTransportOptions;
};

type ClientRegistry = {
	httpTransport: IRequestTransport;
	wsTransport: ISubscriptionTransport;
	info: InfoClient;
	subscription: SubscriptionClient;
	exchange: ExchangeClient | null;
};

let registry: ClientRegistry | null = null;

function getDefaultHttpTransportOptions(): HttpTransportOptions {
	const isTestnet = typeof import.meta !== "undefined" && import.meta.env?.VITE_HYPERLIQUID_TESTNET === "true";
	return { isTestnet };
}

function getDefaultWsTransportOptions(): WebSocketTransportOptions {
	const isTestnet = typeof import.meta !== "undefined" && import.meta.env?.VITE_HYPERLIQUID_TESTNET === "true";
	return { isTestnet };
}

function createTransports(config: ClientRegistryConfig = {}): {
	httpTransport: IRequestTransport;
	wsTransport: ISubscriptionTransport;
} {
	const httpTransport =
		config.httpTransport ?? new HttpTransport(config.httpTransportOptions ?? getDefaultHttpTransportOptions());
	const wsTransport =
		config.wsTransport ?? new WebSocketTransport(config.wsTransportOptions ?? getDefaultWsTransportOptions());
	return { httpTransport, wsTransport };
}

function ensureRegistry(config?: ClientRegistryConfig): ClientRegistry {
	if (registry) return registry;

	const { httpTransport, wsTransport } = createTransports(config);

	registry = {
		httpTransport,
		wsTransport,
		info: new InfoClient({ transport: httpTransport }),
		subscription: new SubscriptionClient({ transport: wsTransport }),
		exchange: null,
	};

	return registry;
}

export function initializeClients(config: ClientRegistryConfig = {}): void {
	if (registry) return;
	ensureRegistry(config);
}

export function getInfoClient(): InfoClient {
	return ensureRegistry().info;
}

export function getSubscriptionClient(): SubscriptionClient {
	return ensureRegistry().subscription;
}

export function getHttpTransport(): IRequestTransport {
	return ensureRegistry().httpTransport;
}

export function getWsTransport(): ISubscriptionTransport {
	return ensureRegistry().wsTransport;
}

export function getExchangeClient(): ExchangeClient | null {
	return registry?.exchange ?? null;
}

export function setExchangeClient(wallet: AbstractWallet | null): ExchangeClient | null {
	const reg = ensureRegistry();
	reg.exchange = wallet ? new ExchangeClient({ transport: reg.httpTransport, wallet }) : null;
	return reg.exchange;
}

export function createExchangeClient(wallet: AbstractWallet): ExchangeClient {
	const reg = ensureRegistry();
	return new ExchangeClient({ transport: reg.httpTransport, wallet });
}

export function getClients(): {
	info: InfoClient;
	subscription: SubscriptionClient;
	exchange: ExchangeClient | null;
} {
	const reg = ensureRegistry();
	return {
		info: reg.info,
		subscription: reg.subscription,
		exchange: reg.exchange,
	};
}
