import { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useConfig } from "./useConfig";
import { useHttpTransport, useSubscriptionTransport } from "./useTransport";

export function useHyperliquidClients() {
	const httpTransport = useHttpTransport();
	const wsTransport = useSubscriptionTransport();
	const { wallet } = useConfig();

	const info = useMemo(() => new InfoClient({ transport: httpTransport }), [httpTransport]);
	const subscription = useMemo(() => new SubscriptionClient({ transport: wsTransport }), [wsTransport]);
	const exchange = useMemo(
		() => (wallet ? new ExchangeClient({ transport: httpTransport, wallet }) : null),
		[httpTransport, wallet],
	);

	return useMemo(() => ({ info, subscription, exchange }), [info, subscription, exchange]);
}
