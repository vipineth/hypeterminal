import type { Chain } from "viem";
import { createConfig, createConnector, http } from "wagmi";
import {
	arbitrum,
	aurora,
	avalanche,
	base,
	blast,
	bsc,
	celo,
	fantom,
	gnosis,
	linea,
	mainnet,
	mantle,
	mode,
	moonbeam,
	optimism,
	polygon,
	polygonZkEvm,
	scroll,
	zkSync,
} from "wagmi/chains";
import { coinbaseWallet, injected, mock, walletConnect } from "wagmi/connectors";
import { APP_NAME } from "@/config/app";
import { getWalletConnectProjectId } from "@/config/env";
import { getRpcUrl } from "@/config/rpc";
import { phoneLink } from "@/lib/phone-link/connector";
import type { MockWalletConfig } from "@/lib/wallet-utils";
import { registerMockWallet } from "@/lib/wallet-utils";

// All chains supported for LiFi bridging — wagmi requires these upfront
const BRIDGE_CHAINS = [
	arbitrum,
	mainnet,
	polygon,
	optimism,
	base,
	bsc,
	avalanche,
	fantom,
	gnosis,
	zkSync,
	scroll,
	linea,
	mode,
	blast,
	mantle,
	celo,
	moonbeam,
	aurora,
	polygonZkEvm,
] as const satisfies readonly [Chain, ...Chain[]];

const BRIDGE_TRANSPORTS = Object.fromEntries(
	BRIDGE_CHAINS.map((chain) => [chain.id, http(getRpcUrl(chain.id, import.meta.env))]),
) as Record<(typeof BRIDGE_CHAINS)[number]["id"], ReturnType<typeof http>>;

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
	env?: Record<string, string | undefined>;
}

const WALLET_CONNECT_METADATA = {
	name: APP_NAME,
	description: "Professional trading terminal for Hyperliquid.",
	url: "https://app.hypeterminal.com",
	icons: ["https://app.hypeterminal.com/icon-192.png"],
};

function lazyWalletConnect(parameters: Parameters<typeof walletConnect>[0]) {
	const connectorFn = walletConnect(parameters);
	return createConnector((config) => ({ ...connectorFn(config), setup: undefined }));
}

function isPresent<T>(value: T | null | undefined): value is T {
	return value != null;
}

export function createWagmiConfig(options: WagmiConfigOptions = {}) {
	const { mockWallets = [], env } = options;
	const mockConnectors = createMockConnectors(mockWallets);
	const walletConnectProjectId = getWalletConnectProjectId(env);

	const walletConnectConnector = walletConnectProjectId
		? lazyWalletConnect({
				projectId: walletConnectProjectId,
				metadata: WALLET_CONNECT_METADATA,
				showQrModal: false,
			})
		: null;

	return createConfig({
		chains: BRIDGE_CHAINS,
		connectors: [...mockConnectors, injected(), coinbaseWallet(), walletConnectConnector, phoneLink()].filter(
			isPresent,
		),
		transports: BRIDGE_TRANSPORTS,
		ssr: true,
	});
}

export const MOCK_WALLETS: MockWalletConfig[] = import.meta.env.DEV
	? [
			{
				name: "Mock Wallet",
				address: "0x5b5d51203a0f9079f8aeb098a6523a13f298c060",
			},
		]
	: [];

export const config = createWagmiConfig({
	mockWallets: MOCK_WALLETS,
});
