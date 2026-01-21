import { useMemo } from "react";
import type { AdminStatus, AdminStatusResult } from "./types";
import { useUserWallet } from "./use-user-wallet";

export function useAdminStatus(): AdminStatusResult {
	const { address, walletClient, isConnecting } = useUserWallet();

	const status: AdminStatus = useMemo(() => {
		if (!address) return "disconnected";
		if (isConnecting || !walletClient) return "connecting";
		return "ready";
	}, [address, isConnecting, walletClient]);

	return {
		status,
		isReady: status === "ready",
		isConnecting: status === "connecting",
		address,
	};
}
