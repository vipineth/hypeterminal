import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import { config } from "@/config/wagmi";
import { HyperliquidProvider } from "@/lib/hyperliquid";
import { MarketsInfoProvider } from "@/lib/hyperliquid/hooks/MarketsInfoProvider";
import { ThemeProvider } from "./theme";
import "@/lib/i18n";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

const env = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true" ? "Testnet" : "Mainnet";

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	useEffect(() => {
		if (typeof window !== "undefined") {
			import("@/lib/performance/init").then(({ initPerformanceMonitoring }) => {
				initPerformanceMonitoring();
			});
		}
	}, []);

	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<I18nProvider i18n={i18n}>
					<ThemeProvider>
						<HyperliquidProvider env={env} builderConfig={DEFAULT_BUILDER_CONFIG} agentName={PROJECT_NAME}>
							<MarketsInfoProvider>{children}</MarketsInfoProvider>
						</HyperliquidProvider>
					</ThemeProvider>
				</I18nProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
