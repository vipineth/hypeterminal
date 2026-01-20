export {
	HttpTransport,
	type HttpTransportOptions,
	type IRequestTransport,
	type ISubscriptionTransport,
	WebSocketTransport,
	type WebSocketTransportOptions,
} from "@nktkas/hyperliquid";
export { createExchangeClient, getInfoClient, getSubscriptionClient, initializeClients } from "./clients";
export type { HyperliquidContextValue, HyperliquidProviderProps } from "./context";
export { HyperliquidProvider, useHyperliquid, useHyperliquidOptional } from "./context";

export * from "./errors";
export * from "./hooks/exchange";
export * from "./hooks/info";
export * from "./hooks/subscription";

export * from "./signing";
export * from "./trading";
export * from "./admin";

export type { AgentRegisterStatus } from "./hooks/agent/types";

export { type HyperliquidClients, useHyperliquidClients } from "./hooks/useClients";
export { useConfig } from "./hooks/useConfig";
export { useHyperliquidApiStatus } from "./hooks/useHyperliquidApiStatus";
export { type PerpMarketInfo, type PerpMarketsData, usePerpMarkets } from "./hooks/usePerpMarkets";
export {
	type ResolvedMarket,
	type ResolvedPerpMarket,
	type UseResolvedMarketOptions,
	useResolvedMarket,
	useSelectedResolvedMarket,
} from "./hooks/useResolvedMarket";
export { useHttpTransport, useSubscriptionTransport } from "./hooks/useTransport";
export { infoKeys } from "./query/keys";

/** @deprecated Use useAgentRegistration from signing/ module */
export { type UseAgentRegistrationResult, useAgentRegistration } from "./hooks/useAgentRegistration";
/** @deprecated Use useTradingClient from trading/ module */
export { type UseSignedExchangeResult, useSignedExchange } from "./hooks/useSignedExchange";
/** @deprecated Use useAgentRegistration from signing/ module */
export { type UseTradingAgentResult, useTradingAgent } from "./hooks/useTradingAgent";
/** @deprecated Use useTradingStatus from trading/ module */
export { type UseTradingStatusResult, useTradingStatus as useTradingStatusLegacy } from "./hooks/useTradingStatus";
export { useTradingGuard } from "./hooks/useTradingGuard";

export * from "./types";
