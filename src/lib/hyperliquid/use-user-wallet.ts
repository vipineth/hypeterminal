import type { Address, WalletClient } from "viem";
import { useConnection, useWalletClient } from "wagmi";

export interface UseUserWalletResult {
	address: Address | undefined;
	walletClient: WalletClient | undefined;
	isConnected: boolean;
	isConnecting: boolean;
}

export function useUserWallet(): UseUserWalletResult {
	const { address, isConnected, isConnecting } = useConnection();
	const { data: walletClient } = useWalletClient();

	return {
		address,
		walletClient,
		isConnected,
		isConnecting,
	};
}
