import type { InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { ReactNode } from "react";
import { createContext, use, useRef } from "react";
import { useStore } from "zustand";
import {
	createWsReconnectTrigger,
	getHttpTransport,
	getInfoClient,
	getSubscriptionClient,
	getWsTransport,
	initializeClients,
} from "./clients";
import { createHyperliquidConfig } from "./create-config";
import { ProviderNotFoundError } from "./errors";
import { registerChaosHarness } from "./internal/websocket/chaos";
import { registerDebugSnapshot, setDebugStore } from "./internal/websocket/debug";
import { registerHealthReport } from "./internal/websocket/health";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";
import { createHyperliquidStore, type HyperliquidStore, type HyperliquidStoreState } from "./store";

const DIAGNOSTICS_STORAGE_KEY = "hl-diagnostics-enabled";

export interface HyperliquidContextValue {
	info: InfoClient;
	subscription: SubscriptionClient;
	env: HyperliquidEnv;
	isTestnet: boolean;
	builderConfig: BuilderConfig;
	agentName: string;
	clientKey: string;
}

export const HyperliquidContext = createContext<HyperliquidContextValue | null>(null);
export const HyperliquidStoreContext = createContext<HyperliquidStore | null>(null);

export interface HyperliquidProviderProps {
	children: ReactNode;
	env: HyperliquidEnv;
	userAddress: `0x${string}` | undefined;
	builderConfig: BuilderConfig;
	agentName?: string;
}

function shouldExposeDiagnostics(): boolean {
	if (import.meta.env.DEV) return true;
	if (typeof window === "undefined") return false;

	try {
		const params = new URLSearchParams(window.location.search);
		const diagnosticsFlag = params.get("hl_diagnostics");

		if (diagnosticsFlag === "1" || diagnosticsFlag === "true") {
			return true;
		}

		if (diagnosticsFlag === "0" || diagnosticsFlag === "false") {
			return false;
		}

		return window.localStorage.getItem(DIAGNOSTICS_STORAGE_KEY) === "1";
	} catch {
		return false;
	}
}

export function HyperliquidProvider({
	children,
	env,
	userAddress,
	builderConfig,
	agentName = "app",
}: HyperliquidProviderProps) {
	const isTestnet = env === "Testnet";

	const initRef = useRef(false);
	if (!initRef.current) {
		initializeClients(isTestnet);
		initRef.current = true;
	}

	const storeRef = useRef<HyperliquidStore | null>(null);
	if (!storeRef.current) {
		storeRef.current = createHyperliquidStore(
			createHyperliquidConfig({
				httpTransport: getHttpTransport(isTestnet),
				wsTransport: getWsTransport(isTestnet),
				ssr: false,
				triggerReconnect: createWsReconnectTrigger(isTestnet),
			}),
		);
		setDebugStore(storeRef.current);
		if (import.meta.env.DEV) registerChaosHarness(storeRef.current);
		if (shouldExposeDiagnostics()) {
			registerDebugSnapshot(storeRef.current);
			registerHealthReport(storeRef.current);
		}
	}

	const clientKey = userAddress ?? "disconnected";

	const value = {
		info: getInfoClient(isTestnet),
		subscription: getSubscriptionClient(isTestnet),
		env,
		isTestnet,
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
	const context = use(HyperliquidContext);
	if (!context) {
		throw new Error("useHyperliquid must be used within a HyperliquidProvider");
	}
	return context;
}

export function useHyperliquidOptional(): HyperliquidContextValue | null {
	return use(HyperliquidContext);
}

export function useHyperliquidStoreApi() {
	const store = use(HyperliquidStoreContext);
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
