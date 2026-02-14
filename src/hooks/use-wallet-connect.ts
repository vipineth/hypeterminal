import { useConnectModal } from "thirdweb/react";
import { useConnect, useConnectors } from "wagmi";
import { thirdwebClient, thirdwebWallets, useThirdwebTheme } from "@/config/thirdweb";
import { isInAppConnector } from "@/lib/wallet-utils";

export function useWalletConnect() {
	const { connect: openModal } = useConnectModal();
	const { mutateAsync: connectAsync } = useConnect();
	const connectors = useConnectors();
	const theme = useThirdwebTheme();

	async function connect() {
		const wallet = await openModal({
			client: thirdwebClient,
			wallets: thirdwebWallets,
			size: "compact",
			theme,
		});

		const inAppConnector = connectors.find(isInAppConnector);
		if (inAppConnector) {
			try {
				await connectAsync({ connector: inAppConnector });
				return;
			} catch {
				// not an in-app wallet, try injected
			}
		}

		const walletId = wallet.id;
		const injectedConnector = connectors.find((c) => c.id === walletId || c.id === "injected");
		if (injectedConnector) {
			try {
				await connectAsync({ connector: injectedConnector });
			} catch {
				// wagmi sync failed silently
			}
		}
	}

	return { connect };
}
