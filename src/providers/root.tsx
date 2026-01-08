import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { useConnection, useWalletClient, WagmiProvider } from "wagmi";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/interface";
import { config } from "@/config/wagmi";
import { HyperliquidProvider } from "@/lib/hyperliquid";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import { ThemeProvider } from "./theme";
import "@/lib/i18n";
import { getHttpTransport, getWsTransport } from "@/lib/hyperliquid/client-registry";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

function HyperliquidProviderWrapper({ children }: { children: React.ReactNode }) {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();
	const wallet = useMemo(() => toHyperliquidWallet(walletClient, address) ?? undefined, [walletClient, address]);
	const env = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "Testnet" : "Mainnet";
	const httpTransport = useMemo(() => getHttpTransport(), []);
	const wsTransport = useMemo(() => {
		if (typeof window === "undefined") return undefined;
		return getWsTransport();
	}, []);
	return (
		<HyperliquidProvider
			env={env}
			userAddress={address}
			wallet={wallet}
			httpTransport={httpTransport}
			wsTransport={wsTransport}
			builderConfig={DEFAULT_BUILDER_CONFIG}
			agentName={PROJECT_NAME}
		>
			{children}
		</HyperliquidProvider>
	);
}

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>
					<ThemeProvider>
						<HyperliquidProviderWrapper>{children}</HyperliquidProviderWrapper>
					</ThemeProvider>
				</I18nProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
