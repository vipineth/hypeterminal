import { HyperliquidProvider, PERSISTED_QUERY_PREFIX } from "@hypeterminal/hl-react";
import { useHyperliquidStoreApi } from "@hypeterminal/hl-react/provider";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect } from "react";
import { useConnection, WagmiProvider } from "wagmi";
import { APP_NAME, RQ_CACHE_BUSTER, STORAGE_KEYS } from "@/config/app";
import { DEFAULT_BUILDER_CONFIG } from "@/config/hyperliquid";
import { RQ_CACHE_MAX_AGE_MS } from "@/config/time";
import { config } from "@/config/wagmi";
import { MarketsProvider } from "@/lib/hyperliquid/markets";
import { getNetwork } from "@/lib/network";
import { trackCollateralReceipts } from "@/stores/use-collateral-generation-store";
import "@/lib/i18n";

const network = getNetwork();
const env = network === "testnet" ? "Testnet" : "Mainnet";

const isServer = typeof document === "undefined";

if (!isServer) {
	try {
		localStorage.removeItem(STORAGE_KEYS.LEGACY_METADATA);
	} catch {}
}

const persister = isServer
	? null
	: createSyncStoragePersister({
			storage: window.localStorage,
			key: STORAGE_KEYS.RQ_CACHE,
			throttleTime: 1000,
		});

export function getRootProviderContext() {
	const queryClient = new QueryClient();
	return { queryClient };
}

function CollateralReceipts() {
	const store = useHyperliquidStoreApi();
	useEffect(() => trackCollateralReceipts(store), [store]);
	return null;
}

function HyperliquidBridge({ children }: { children: React.ReactNode }) {
	const { address } = useConnection();

	return (
		<HyperliquidProvider env={env} userAddress={address} builderConfig={DEFAULT_BUILDER_CONFIG} agentName={APP_NAME}>
			<CollateralReceipts />
			<MarketsProvider>{children}</MarketsProvider>
		</HyperliquidProvider>
	);
}

export function RootProvider({ children, queryClient }: { children: React.ReactNode; queryClient: QueryClient }) {
	if (isServer || !persister) {
		return (
			<WagmiProvider config={config}>
				<QueryClientProvider client={queryClient}>
					<I18nProvider i18n={i18n}>
						<HyperliquidBridge>{children}</HyperliquidBridge>
					</I18nProvider>
				</QueryClientProvider>
			</WagmiProvider>
		);
	}

	return (
		<WagmiProvider config={config}>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister,
					maxAge: RQ_CACHE_MAX_AGE_MS,
					buster: RQ_CACHE_BUSTER,
					dehydrateOptions: {
						shouldDehydrateQuery: (query) => query.queryKey[0] === PERSISTED_QUERY_PREFIX,
					},
				}}
			>
				<I18nProvider i18n={i18n}>
					<HyperliquidBridge>{children}</HyperliquidBridge>
				</I18nProvider>
			</PersistQueryClientProvider>
		</WagmiProvider>
	);
}
