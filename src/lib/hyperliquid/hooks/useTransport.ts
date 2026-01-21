import type { IRequestTransport, ISubscriptionTransport } from "@nktkas/hyperliquid";
import { MissingTransportError } from "@/lib/hyperliquid/errors";
import { useConfig } from "@/lib/hyperliquid/provider";

export function useHttpTransport(): IRequestTransport {
	const { httpTransport } = useConfig();
	if (!httpTransport || typeof httpTransport.request !== "function") {
		throw new MissingTransportError("HTTP transport is not configured");
	}
	return httpTransport;
}

export function useSubscriptionTransport(): ISubscriptionTransport {
	const { wsTransport } = useConfig();
	if (!wsTransport || typeof wsTransport.subscribe !== "function") {
		throw new MissingTransportError("Subscription transport is not configured");
	}
	return wsTransport;
}
