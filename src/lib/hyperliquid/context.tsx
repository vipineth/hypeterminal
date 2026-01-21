import type { ExchangeClient, InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useRef } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import {
	createExchangeClient,
	getHttpTransport,
	getInfoClient,
	getSubscriptionClient,
	getWsTransport,
	initializeClients,
} from "./clients";
import { createHyperliquidConfig } from "./create-config";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";
import { createHyperliquidStore, type HyperliquidStore } from "./store";
import { toHyperliquidWallet } from "./wallet";

export interface HyperliquidContextValue {
	exchangeClient: ExchangeClient | null;
	info: InfoClient;
	subscription: SubscriptionClient;
	env: HyperliquidEnv;
	builderConfig: BuilderConfig;
	agentName: string;
	clientKey: string;
}

const HyperliquidContext = createContext<HyperliquidContextValue | null>(null);
export const HyperliquidStoreContext = createContext<HyperliquidStore | null>(null);

export interface HyperliquidProviderProps {
	children: ReactNode;
	env: HyperliquidEnv;
	builderConfig?: BuilderConfig;
	agentName?: string;
}

export function HyperliquidProvider({
	children,
	env,
	builderConfig = DEFAULT_BUILDER_CONFIG,
	agentName = PROJECT_NAME,
}: HyperliquidProviderProps) {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

	const initRef = useRef(false);
	if (!initRef.current) {
		initializeClients();
		initRef.current = true;
	}

	const storeRef = useRef<HyperliquidStore | null>(null);
	if (!storeRef.current) {
		storeRef.current = createHyperliquidStore(
			createHyperliquidConfig({
				httpTransport: getHttpTransport(),
				wsTransport: getWsTransport(),
				ssr: false,
			}),
		);
	}

	const wallet = useMemo(() => toHyperliquidWallet(walletClient, address), [walletClient, address]);

	const exchangeClient = useMemo(() => {
		if (!wallet) return null;
		return createExchangeClient(wallet);
	}, [wallet]);

	const clientKey = address ?? "disconnected";

	const value = {
		exchangeClient,
		info: getInfoClient(),
		subscription: getSubscriptionClient(),
		env,
		builderConfig,
		agentName,
		clientKey,
	};

	return (
		<HyperliquidStoreContext.Provider value={storeRef.current}>
			<HyperliquidContext.Provider value={value}>{children}</HyperliquidContext.Provider>
		</HyperliquidStoreContext.Provider>
	);
}

export function useHyperliquid(): HyperliquidContextValue {
	const context = useContext(HyperliquidContext);
	if (!context) {
		throw new Error("useHyperliquid must be used within a HyperliquidProvider");
	}
	return context;
}

export function useHyperliquidOptional(): HyperliquidContextValue | null {
	return useContext(HyperliquidContext);
}

export function useExchangeClient(): ExchangeClient | null {
	const { exchangeClient } = useHyperliquid();
	return exchangeClient;
}
