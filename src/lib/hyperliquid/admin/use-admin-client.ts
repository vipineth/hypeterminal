import type { ExchangeClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { createExchangeClient } from "../clients";
import { toHyperliquidWallet } from "../wallet";
import { useUserWallet } from "./use-user-wallet";

export interface UseAdminClientResult {
	client: ExchangeClient | null;
	isReady: boolean;
}

export function useAdminClient(): UseAdminClientResult {
	const { address, walletClient } = useUserWallet();

	const client = useMemo(() => {
		if (!walletClient || !address) return null;
		const wallet = toHyperliquidWallet(walletClient, address);
		if (!wallet) return null;
		return createExchangeClient(wallet);
	}, [walletClient, address]);

	return {
		client,
		isReady: client !== null,
	};
}
