export type ExchangeScope = "all" | "perp" | "spot" | "builders-perp";

export const EXCHANGE_SCOPES: ExchangeScope[] = ["all", "perp", "spot", "builders-perp"];

export const DEFAULT_SELECTED_MARKETS: Record<ExchangeScope, string> = {
	all: "BTC",
	perp: "BTC",
	spot: "@107", // ETH/USDC
	"builders-perp": "xyz:SILVER",
};
