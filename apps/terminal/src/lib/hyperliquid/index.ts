export {
	type ApiStatus,
	type BuilderConfig,
	convertFeeToPercentageString,
	type ExchangeMethod,
	type ExchangeParams,
	type ExchangeResponse,
	getExplorerTokenUrl,
	getExplorerTxUrl,
	type HyperliquidConfig,
	type InfoMethod,
	type InfoParams,
	type InfoResponse,
	type Position,
	type RegistrationStatus,
	type SubEvent,
	type SubMethod,
	type SubParams,
	useAgentRegistration,
	useAgentStatus,
	useAgentWalletActions,
	useAgentWalletStorage,
	useApiStatus,
	useExchange,
	useHyperliquid,
	useSubscription,
	useTradingGuard,
	useUserPositions,
} from "@hypeterminal/hl-react";

export type { MarketKind } from "@/domain/market";

import {
	getInfoClient as getInfoClientBase,
	getSubscriptionClient as getSubscriptionClientBase,
} from "@hypeterminal/hl-react";
import { isTestnet } from "@/lib/network";

export function getInfoClient() {
	return getInfoClientBase(isTestnet());
}

export function getSubscriptionClient() {
	return getSubscriptionClientBase(isTestnet());
}
export {
	type SpotMarketInfo,
	type UnifiedMarketInfo,
	useMarketsInfo,
	useSelectedMarketInfo,
} from "./hooks/useMarketsInfo";
export { useMarkets } from "./markets";
export { useDeposit } from "./use-deposit";
