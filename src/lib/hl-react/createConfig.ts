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

export function createHyperliquidConfig(params: CreateHyperliquidConfigParameters): HyperliquidConfig {
	if (params.httpTransport && params.httpTransportOptions) {
		throw new Error("Provide either httpTransport or httpTransportOptions, not both.");
	}
	if (params.wsTransport && params.wsTransportOptions) {
		throw new Error("Provide either wsTransport or wsTransportOptions, not both.");
	}

	const httpTransport = params.httpTransport ?? new HttpTransport(params.httpTransportOptions);
	const hasWebSocket = typeof (globalThis as { WebSocket?: unknown }).WebSocket !== "undefined";
	const wsTransport =
		params.wsTransport ??
		(params.wsTransportOptions
			? new WebSocketTransport(params.wsTransportOptions)
			: hasWebSocket
				? new WebSocketTransport()
				: undefined);
	return {
		httpTransport,
		wsTransport,
		wallet: params.wallet,
		ssr: params.ssr ?? false,
	};
}
