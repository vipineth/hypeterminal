import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import { config } from "@/config/wagmi";
import { HyperliquidProvider } from "@/lib/hyperliquid";
import { MarketsProvider } from "@/lib/hyperliquid/markets";
import { getNetwork } from "@/lib/network";
import "@/lib/i18n";

const network = getNetwork();
const env = network === "testnet" ? "Testnet" : "Mainnet";

const isServer = typeof document === "undefined";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	if (isServer) {
		return (
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>{children}</I18nProvider>
			</QueryClientProvider>
		);
	}

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>
					<HyperliquidProvider env={env} builderConfig={DEFAULT_BUILDER_CONFIG} agentName={PROJECT_NAME}>
						<MarketsProvider>{children}</MarketsProvider>
					</HyperliquidProvider>
				</I18nProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
