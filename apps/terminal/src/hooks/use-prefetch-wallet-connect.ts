import { useEffect } from "react";
import { useConnectors } from "wagmi";
import { isWalletConnectConnector } from "@/lib/wallet-utils";

export function usePrefetchWalletConnect(enabled: boolean) {
	const connector = useConnectors().find(isWalletConnectConnector);

	useEffect(() => {
		if (!enabled || !connector) return;
		connector.getProvider().catch(() => {});
	}, [enabled, connector]);
}
