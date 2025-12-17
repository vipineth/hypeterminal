import { createConfig, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { coinbaseWallet, injected, mock, walletConnect } from "wagmi/connectors";

const mockConnector = import.meta.env.DEV
	? mock({
			accounts: ["0x7fdafde5cfb5465924316eced2d3715494c517d1"],
			features: {
				defaultConnected: true,
			},
		})
	: null;

export const config = createConfig({
	chains: [arbitrum],
	connectors: [
		...(mockConnector ? [mockConnector] : []),
		injected(),
		coinbaseWallet(),
		walletConnect({ projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID }),
	],
	transports: {
		[arbitrum.id]: http(),
	},
});
