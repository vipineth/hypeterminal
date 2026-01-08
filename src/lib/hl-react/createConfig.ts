import {
	type ExchangeClient,
	HttpTransport,
	type HttpTransportOptions,
	type IRequestTransport,
	type ISubscriptionTransport,
	WebSocketTransport,
	type WebSocketTransportOptions,
} from "@nktkas/hyperliquid";
import type { HyperliquidConfig } from "./types";

type WalletType = Extract<ConstructorParameters<typeof ExchangeClient>[0], { wallet: unknown }>["wallet"];

export type CreateHyperliquidConfigParameters = {
	httpTransport?: IRequestTransport;
	wsTransport?: ISubscriptionTransport;
	httpTransportOptions?: HttpTransportOptions;
	wsTransportOptions?: WebSocketTransportOptions;
	wallet?: WalletType;
	ssr?: boolean;
};

function hasWebSocketSupport(): boolean {
	return typeof (globalThis as { WebSocket?: unknown }).WebSocket !== "undefined";
}

function createHttpTransport(
	providedTransport: IRequestTransport | undefined,
	options: HttpTransportOptions | undefined,
): IRequestTransport {
	if (providedTransport) {
		return providedTransport;
	}
	return new HttpTransport(options);
}

function createWebSocketTransport(
	providedTransport: ISubscriptionTransport | undefined,
	options: WebSocketTransportOptions | undefined,
	ssr: boolean,
): ISubscriptionTransport | undefined {
	if (providedTransport) {
		return providedTransport;
	}

	if (ssr) {
		return;
	}

	if (options) {
		return new WebSocketTransport(options);
	}

	if (!hasWebSocketSupport()) {
		return;
	}

	return new WebSocketTransport();
}

export function createHyperliquidConfig(params: CreateHyperliquidConfigParameters = {}): HyperliquidConfig {
	if (params.httpTransport && params.httpTransportOptions) {
		throw new Error("Provide either httpTransport or httpTransportOptions, not both.");
	}

	if (params.wsTransport && params.wsTransportOptions) {
		throw new Error("Provide either wsTransport or wsTransportOptions, not both.");
	}

	const httpTransport = createHttpTransport(params.httpTransport, params.httpTransportOptions);
	const wsTransport = createWebSocketTransport(params.wsTransport, params.wsTransportOptions, params.ssr ?? false);

	return {
		httpTransport,
		wsTransport,
		wallet: params.wallet,
		ssr: params.ssr ?? false,
	};
}
