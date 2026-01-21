import type { InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { DEFAULT_BUILDER_CONFIG, PROJECT_NAME } from "@/config/hyperliquid";
import type { HyperliquidContextValue } from "./context";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";

const HyperliquidContext = createContext<HyperliquidContextValue | null>(null);

export interface MockHyperliquidProviderProps {
	children: ReactNode;
	value?: Partial<HyperliquidContextValue>;
}

function createMockInfoClient(): InfoClient {
	return {
		allMids: async () => ({}),
		clearinghouseState: async () => ({}) as never,
		extraAgents: async () => [],
	} as unknown as InfoClient;
}

function createMockSubscriptionClient(): SubscriptionClient {
	return {
		subscribe: async () => async () => {},
	} as unknown as SubscriptionClient;
}

export function MockHyperliquidProvider({ children, value = {} }: MockHyperliquidProviderProps) {
	const mockValue: HyperliquidContextValue = {
		exchangeClient: null,
		info: createMockInfoClient(),
		subscription: createMockSubscriptionClient(),
		env: "Testnet" as HyperliquidEnv,
		builderConfig: DEFAULT_BUILDER_CONFIG as BuilderConfig,
		agentName: PROJECT_NAME,
		clientKey: "mock",
		...value,
	};

	return <HyperliquidContext.Provider value={mockValue}>{children}</HyperliquidContext.Provider>;
}

export function useMockHyperliquid(): HyperliquidContextValue {
	const context = useContext(HyperliquidContext);
	if (!context) {
		throw new Error("useMockHyperliquid must be used within a MockHyperliquidProvider");
	}
	return context;
}
