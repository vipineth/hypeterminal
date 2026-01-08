import { useContext } from "react";
import { HyperliquidClientsContext, type HyperliquidClients } from "../context";
import { ProviderNotFoundError } from "../errors";

export function useHyperliquidClients(): HyperliquidClients {
	const clients = useContext(HyperliquidClientsContext);
	if (!clients) {
		throw new ProviderNotFoundError();
	}
	return clients;
}
