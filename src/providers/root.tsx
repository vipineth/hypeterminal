import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import { config } from "@/config/wagmi";
import { HyperliquidProvider } from "@/lib/hyperliquid";
import { MarketsProvider } from "@/lib/hyperliquid/markets";
import { PerfPanelProvider } from "./perf-panel";
import "@/lib/i18n";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

const env = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "Testnet" : "Mainnet";

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>
					<HyperliquidProvider env={env} builderConfig={DEFAULT_BUILDER_CONFIG} agentName={PROJECT_NAME}>
						<MarketsProvider>
							<PerfPanelProvider>{children}</PerfPanelProvider>
						</MarketsProvider>
					</HyperliquidProvider>
				</I18nProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
