import { createConfig, http } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { coinbaseWallet, injected, mock, walletConnect } from "wagmi/connectors";
import type { MockWalletConfig } from "@/lib/wallet-utils";
import { registerMockWallet } from "@/lib/wallet-utils";

function createMockConnectors(mockWallets: MockWalletConfig[]) {
	return mockWallets.map((wallet) => {
		registerMockWallet(wallet);
		return mock({
			accounts: [wallet.address],
			features: { reconnect: true },
		});
	});
}

interface WagmiConfigOptions {
	mockWallets?: MockWalletConfig[];
}

export function createWagmiConfig(options: WagmiConfigOptions = {}) {
	const { mockWallets = [] } = options;
	const mockConnectors = createMockConnectors(mockWallets);

	return createConfig({
		chains: [arbitrum],
		connectors: [
			...mockConnectors,
			injected(),
			coinbaseWallet(),
			walletConnect({ projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID }),
		],
		transports: {
			[arbitrum.id]: http(),
		},
		ssr: true,
	});
}

export const MOCK_WALLETS: MockWalletConfig[] = [
	{
		name: "Mock Wallet",
		address: "0x5b5d51203a0f9079f8aeb098a6523a13f298c060",
	},
];

export const config = createWagmiConfig({
	mockWallets: MOCK_WALLETS,
});
