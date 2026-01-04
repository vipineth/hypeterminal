import type { BetAmount, MaxLeverage, TapAsset } from "./types";

export const TAP_TRADE_CONFIG = {
	// Grid - 2D layout
	GRID_ROWS: 14, // Price levels (7 above + 7 below current price)
	GRID_COLS: 10, // Columns for the grid (time buckets)
	PRICE_STEP_PERCENT: 0.04, // Price step between rows
	TIME_BUCKET_SECONDS: 10, // Each column = 10 seconds

	// Legacy box config (for backwards compat)
	BOX_SPACING_PERCENT: 0.5,
	MIN_DISTANCE_PERCENT: 0.5,
	MAX_BOXES_PER_SIDE: 10,

	// Leverage options
	MAX_LEVERAGE_OPTIONS: [10, 20, 30, 50, 100] as const satisfies readonly MaxLeverage[],
	DEFAULT_MAX_LEVERAGE: 100 as MaxLeverage,

	// Betting
	BET_AMOUNTS: [1, 2, 3, 4, 5] as const satisfies readonly BetAmount[],
	DEFAULT_BET: 1 as BetAmount,

	// Assets
	SUPPORTED_ASSETS: ["BTC", "ETH", "SOL"] as const satisfies readonly TapAsset[],
	DEFAULT_ASSET: "BTC" as TapAsset,

	// UI
	DOUBLE_TAP_WINDOW_MS: 1500,
	FADE_DURATION_MS: 250,
	PRICE_CHART_DURATION_MS: 60000, // 1 minute of historical data
	PRICE_UPDATE_THROTTLE_MS: 100,

	// Storage keys
	STORAGE_KEY_SETTINGS: "tap-trade-settings-v1",
	STORAGE_KEY_ACTIVE_BETS: "tap-trade-active-bets-v1",
} as const;

// Asset to coin mapping for Hyperliquid
export const ASSET_TO_COIN: Record<TapAsset, string> = {
	BTC: "BTC",
	ETH: "ETH",
	SOL: "SOL",
};

// Box style classes
export const BOX_STYLES = {
	LONG: {
		available: "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30",
		highlighted: "bg-terminal-cyan/30 border-terminal-cyan text-terminal-cyan animate-pulse",
		active: "bg-terminal-amber/30 border-terminal-amber text-terminal-amber",
	},
	SHORT: {
		available: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
		highlighted: "bg-terminal-cyan/30 border-terminal-cyan text-terminal-cyan animate-pulse",
		active: "bg-terminal-amber/30 border-terminal-amber text-terminal-amber",
	},
} as const;
