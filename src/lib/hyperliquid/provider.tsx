import type { InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useConnection } from "wagmi";
import { useStore } from "zustand";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import { getHttpTransport, getInfoClient, getSubscriptionClient, getWsTransport, initializeClients } from "./clients";
import { createHyperliquidConfig } from "./create-config";
import { ProviderNotFoundError } from "./errors";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";
import { createHyperliquidStore, type HyperliquidStore, type HyperliquidStoreState } from "./store";

export interface HyperliquidContextValue {
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

	const clientKey = address ?? "disconnected";

	const value = {
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

export function useHyperliquidStoreApi() {
	const store = useContext(HyperliquidStoreContext);
	if (!store) {
		throw new ProviderNotFoundError();
	}
	return store;
}

export function useHyperliquidStore<T>(selector: (state: HyperliquidStoreState) => T): T {
	return useStore(useHyperliquidStoreApi(), selector);
}

export function useConfig() {
	return useHyperliquidStore((state) => state.config);
}
