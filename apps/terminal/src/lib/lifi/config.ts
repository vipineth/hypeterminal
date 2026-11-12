import type { SDKClient } from "@lifi/sdk";
import { createClient } from "@lifi/sdk";
import { EthereumProvider } from "@lifi/sdk-provider-ethereum";
import type { Config as WagmiConfig } from "@wagmi/core";
import { getConnection, getConnectorClient, switchChain } from "@wagmi/core";
import type { Client } from "viem";
import { LIFI_INTEGRATOR } from "@/config/app";
import { config as wagmiConfig } from "@/config/wagmi";

const wc = wagmiConfig as unknown as WagmiConfig;
let lifiClient: SDKClient | null = null;

export function getLiFiClient(): SDKClient {
	if (lifiClient) return lifiClient;

	lifiClient = createClient({
		integrator: LIFI_INTEGRATOR,
		providers: [
			EthereumProvider({
				getWalletClient: async () => {
					const account = getConnection(wc);
					return getConnectorClient(wc, { account: account.address }) as Promise<Client>;
				},
				switchChain: async (chainId: number) => {
					await switchChain(wc, { chainId });
					const account = getConnection(wc);
					return getConnectorClient(wc, { account: account.address, chainId }) as Promise<Client>;
				},
			}),
		],
	});
	return lifiClient;
}
