import type { OrderParameters } from "@nktkas/hyperliquid";

export const TP_QUICK_PERCENT_OPTIONS = [25, 50, 100, 200] as const;
export const SL_QUICK_PERCENT_OPTIONS = [5, 10, 25, 50] as const;

export const SMALL_BALANCE_THRESHOLD_USD = 1;
export const MAX_HISTORY_ROWS = 200;
export const LIQ_WARNING_PROXIMITY = 0.1;

export const ORDER_MIN_NOTIONAL_USD = 10;
export const ORDER_FEE_RATE_TAKER = 0.00045;
export const ORDER_FEE_RATE_MAKER = 0.00015;
export const ORDER_FEE_RATE_SPOT_TAKER = 0.0007;
export const ORDER_FEE_RATE_SPOT_MAKER = 0.0004;
export const SIZE_PERCENT_OPTIONS = [0, 25, 50, 75, 100] as const;

/** Liquidation-distance safety multiplier applied to the 1/leverage price buffer. */
export const LIQUIDATION_BUFFER_FACTOR = 0.9;
/** Distance ratio below which the estimated liquidation price is flagged as too close. */
export const LIQ_WARNING_THRESHOLD = 0.05;

// HL tick-size protocol: non-integer prices carry at most 5 significant figures and (6 perp | 8 spot) - szDecimals decimals.
export const HL_PRICE_MAX_SIG_FIGS = 5;
export const HL_PERP_PRICE_MAX_DECIMALS = 6;
export const HL_SPOT_PRICE_MAX_DECIMALS = 8;
/** Leverage ceiling below which `getDefaultLeverage` returns the max instead of halving. */
export const DEFAULT_LEVERAGE_FALLBACK = 5;

export const TWAP_MINUTES_MIN = 5;
export const TWAP_MINUTES_MAX = 1440;
export const TWAP_MIN_NOTIONAL_PER_MINUTE_USD = 10;
export const TWAP_SUBORDER_INTERVAL_SECONDS = 30;
export const SCALE_LEVELS_MIN = 2;
export const SCALE_LEVELS_MAX = 20;

export const DEFAULT_MAX_LEVERAGE = 50;
export const DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT = 2.5;
export const MARKET_ORDER_SLIPPAGE_MIN_PERCENT = 0.1;
export const MARKET_ORDER_SLIPPAGE_MAX_PERCENT = 5;

export const POSITIONS_TABS = [
	{ value: "balances", label: "Balances" },
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Open Orders" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "Trade History" },
	{ value: "funding", label: "Funding History" },
	{ value: "orders-history", label: "Order History" },
] as const;

export const MOBILE_POSITIONS_TABS = [
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Orders" },
	{ value: "balances", label: "Balances" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "Trades" },
	{ value: "orders-history", label: "Order Hist." },
	{ value: "funding", label: "Funding" },
] as const;

export type MobilePositionsTabValue = (typeof MOBILE_POSITIONS_TABS)[number]["value"];

export const ORDER_TYPES = [
	"market",
	"limit",
	"stopMarket",
	"stopLimit",
	"takeProfitMarket",
	"takeProfitLimit",
	"twap",
	"scale",
] as const;

export type OrderType = (typeof ORDER_TYPES)[number];
export type AdvancedOrderType = Exclude<OrderType, "market" | "limit">;
export type ExchangeOrder = OrderParameters["orders"][number] & { p: string; s: string };

type OrderTypeSpec = ExchangeOrder["t"];
export type LimitTif = Extract<OrderTypeSpec, { limit: unknown }>["limit"]["tif"];

export const TIF_OPTIONS: Record<"Gtc" | "Ioc" | "Alo", { label: string }> = {
	Gtc: { label: "GTC" },
	Ioc: { label: "IOC" },
	Alo: { label: "Post Only" },
};

export const OPEN_ORDER_TYPE_PREFIXES = {
	takeProfit: "Take Profit",
	stop: "Stop",
} as const;
