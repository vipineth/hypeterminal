import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useConnection, useWalletClient, WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { createHyperliquidConfig, HyperliquidProvider } from "@/lib/hl-react";
import { ThemeProvider } from "./theme";
import "@/lib/i18n";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/interface";

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

function HyperliquidProviderWrapper({ children }: { children: React.ReactNode }) {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	const hyperliquidConfig = createHyperliquidConfig({
		wallet: walletClient,
		ssr: false,
	});

	// During SSR, render children without Hyperliquid providers
	if (!isClient || !hyperliquidConfig) {
		return <>{children}</>;
	}

	return (
		<HyperliquidProvider
			env="Mainnet"
			userAddress={address}
			wallet={walletClient}
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
