import type { ExchangeClient } from "@nktkas/hyperliquid";
import { useMemo } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { createExchangeClient } from "../clients";
import { toHyperliquidWallet } from "../wallet";

export interface UseAdminClientResult {
	client: ExchangeClient | null;
	isReady: boolean;
}

export function useAdminClient(): UseAdminClientResult {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

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
