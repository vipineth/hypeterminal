export const APP_NAME = "HypeTerminal";
export const APP_VERSION = "v0.1.0";

export const FALLBACK_VALUE_PLACEHOLDER = "-";
export const FORMAT_COMPACT_THRESHOLD = 10_000;
export const FORMAT_COMPACT_DEFAULT = true;

export const DEFAULT_FAVORITE_MARKETS = ["BTC", "ETH", "HYPE"] as const;

export const RECENT_WALLETS_LIMIT = 3;
export const DEFAULT_MARKET_NAME = "BTC";
export const DEFAULT_QUOTE_TOKEN = "USDC";
export const USDC_TRANSFER_DECIMALS = 2;

export const HL_ALL_DEXS = "ALL_DEXS" as const;

export const STORAGE_KEYS = {
	MARKET_PREFS: "market-prefs-v2",
	GLOBAL_SETTINGS: "global-settings-v2",
	META_CACHE: "hyperliquid-meta-cache-v2",
	SIDEBAR_STATE: "sidebar_state-v2",
	ORDER_ENTRY: "order-entry-v2",
	LAST_MARK: "hl-last-mark-v1",
	MARKETS_STATS: "hl-mkt-stats-v1",
	RECENT_WALLETS: "hypeterminal:recent-wallets",
	RQ_CACHE: "hl-rq-cache-v1",
	PHONE_LINK: "hypeterminal:phone-link-v1",
	LEGACY_METADATA: "hl-markets-meta-v1",
} as const;

export const RQ_CACHE_BUSTER = "v1";

export const GITHUB_URL = "https://github.com/vipineth/hypeterminal/";
export const TOKEN_ICON_BASE_URL = "https://app.hyperliquid.xyz/coins";

export const LIFI_INTEGRATOR = "hypeterminal";
