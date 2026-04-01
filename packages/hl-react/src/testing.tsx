import type { InfoClient, SubscriptionClient } from "@nktkas/hyperliquid";
import type { ReactNode } from "react";
import { useContext } from "react";
import { HyperliquidContext, type HyperliquidContextValue } from "./provider";
import type { BuilderConfig, HyperliquidEnv } from "./signing/types";

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
		info: createMockInfoClient(),
		subscription: createMockSubscriptionClient(),
		env: "Testnet" as HyperliquidEnv,
		isTestnet: true,
		builderConfig: { b: "0x0000000000000000000000000000000000000000", f: 0 } as BuilderConfig,
		agentName: "test",
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
