import { createConfig, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

export const config = createConfig({
	chains: [arbitrum],
	connectors: [
		injected(),
		coinbaseWallet(),
		walletConnect({ projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID }),
	],
	transports: {
		[arbitrum.id]: http(),
	},
});
