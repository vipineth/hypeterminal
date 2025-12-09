/**
 * Query key factory for Hyperliquid data
 * Provides consistent, type-safe cache key management
 */
export const hyperliquidKeys = {
	all: ["hyperliquid"] as const,

	meta: () => [...hyperliquidKeys.all, "meta"] as const,
	allMids: () => [...hyperliquidKeys.all, "allMids"] as const,
	metaAndAssetCtxs: () => [...hyperliquidKeys.all, "metaAndAssetCtxs"] as const,
	orderBook: (coin: string) => [...hyperliquidKeys.all, "orderBook", coin] as const,
	candles: (coin: string, interval: string) => [...hyperliquidKeys.all, "candles", coin, interval] as const,
	user: (address: string) => [...hyperliquidKeys.all, "user", address] as const,
	clearinghouseState: (address: string) => [...hyperliquidKeys.user(address), "clearinghouseState"] as const,
	openOrders: (address: string) => [...hyperliquidKeys.user(address), "openOrders"] as const,
	userFills: (address: string) => [...hyperliquidKeys.user(address), "fills"] as const,
	userFunding: (address: string) => [...hyperliquidKeys.user(address), "funding"] as const,

	trades: (coin: string) => [...hyperliquidKeys.all, "trades", coin] as const,
} as const;
