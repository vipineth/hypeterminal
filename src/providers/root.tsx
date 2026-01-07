import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { WalletClient } from "viem";
import { useConnection, useWalletClient, WagmiProvider } from "wagmi";
import { config } from "@/config/wagmi";
import { createHyperliquidConfig, HyperliquidProvider } from "@/lib/hl-react";
import { SigningModeProvider } from "@/lib/hl-react/hooks/agent";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import { ThemeProvider } from "./theme";
import "@/lib/i18n";

let hyperliquidConfig: ReturnType<typeof createHyperliquidConfig> | null = null;
function getHyperliquidConfig() {
	if (!hyperliquidConfig) {
		hyperliquidConfig = createHyperliquidConfig({});
	}
	return hyperliquidConfig;
}

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return {
		queryClient,
	};
}

/**
 * Inner provider that uses wagmi hooks to get wallet info for Hyperliquid.
 * Must be inside WagmiProvider. Only renders on client (SSR-safe).
 */
function HyperliquidProviderWrapper({ children }: { children: React.ReactNode }) {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

	// SSR guard - only render Hyperliquid providers on client
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Create config lazily (useMemo ensures stable reference)
	const hlConfig = useMemo(() => (isClient ? getHyperliquidConfig() : null), [isClient]);

	// During SSR, render children without Hyperliquid providers
	if (!isClient || !hlConfig) {
		return <>{children}</>;
	}

	return (
		<HyperliquidProvider config={hlConfig}>
			<SigningModeProvider
				userAddress={address}
				walletClient={walletClient}
				env="mainnet"
				toHyperliquidWallet={toHyperliquidWallet as (wc: WalletClient, addr: string) => unknown}
				agentName="HypeTerminal"
			>
				{children}
			</SigningModeProvider>
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
