import type { ChartingLibraryFeatureset, ResolutionString, TimeFrameItem } from "@/types/charting_library";

export const APP_NAME = "HypeTerminal";
export const APP_VERSION = "v0.1.0";

export const QUICK_PERCENT_OPTIONS = [25, 50, 100, 200, 400] as const;
export const TP_QUICK_PERCENT_OPTIONS = [25, 50, 100, 200] as const;
export const SL_QUICK_PERCENT_OPTIONS = [5, 10, 25, 50] as const;

export const FALLBACK_VALUE_PLACEHOLDER = "-";
export const FORMAT_COMPACT_THRESHOLD = 10_000;
export const FORMAT_COMPACT_DEFAULT = true;

export const MOBILE_BREAKPOINT_PX = 768;

export const DEFAULT_MARKET_KEY = "perp:BTC";
export const DEFAULT_MARKET_NAME = "BTC";
export const DEFAULT_MARKET_SCOPE = "perp" as const;
export const DEFAULT_QUOTE_TOKEN = "USDC";

export const HL_ALL_DEXS = "ALL_DEXS" as const;

export const ORDER_MIN_NOTIONAL_USD = 10;
export const ORDER_FEE_RATE_TAKER = 0.00045;
export const ORDER_FEE_RATE_MAKER = 0.00015;
export const ORDER_SIZE_PERCENT_STEPS = [25, 50, 75, 100] as const;
export const ORDER_LEVERAGE_STEPS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200] as const;

export const TWAP_MINUTES_MIN = 5;
export const TWAP_MINUTES_MAX = 1440;
export const SCALE_LEVELS_MIN = 2;
export const SCALE_LEVELS_MAX = 20;

export const DEFAULT_MAX_LEVERAGE = 50;
export const MARKET_LEVERAGE_HARD_MAX = 100;
export const DEFAULT_MARKET_ORDER_SLIPPAGE_PERCENT = 2.5;
export const MARKET_ORDER_SLIPPAGE_MIN_PERCENT = 0.1;
export const MARKET_ORDER_SLIPPAGE_MAX_PERCENT = 100;
export const DEFAULT_LEVERAGE_BY_MODE = { cross: 10, isolated: 10 } as const;

export const STORAGE_KEYS = {
	MARKET_PREFS: "market-prefs-v2",
	GLOBAL_SETTINGS: "global-settings-v2",
	META_CACHE: "hyperliquid-meta-cache-v2",
	SIDEBAR_STATE: "sidebar_state-v2",
	ORDER_ENTRY: "order-entry-v2",
} as const;

export const GITHUB_URL = "https://github.com/vipineth/hypeterminal/";
export const TOKEN_ICON_BASE_URL = "https://app.hyperliquid.xyz/coins";

export const PANEL_LAYOUT = {
	MAIN: {
		id: "CHART_WITH_SWAPBOX",
		analysis: { defaultSize: 77 },
		sidebar: { defaultSize: 23 },
	},
	ANALYSIS: {
		id: "CHART_WITH_POSITIONS",
		chart: { defaultSize: 55, disconnectedSize: 70, minSize: 40 },
		positions: { defaultSize: 45, disconnectedSize: 30, minSize: 15 },
	},
	MARKET: {
		id: "CHART_WITH_ORDERBOOK",
		chart: { defaultSize: 76, minSize: 40 },
		orderbook: { defaultSize: 24, minSize: 20 },
	},
} as const;

export const SIDEBAR_LAYOUT = {
	WIDTH: "16rem",
	WIDTH_MOBILE: "18rem",
	WIDTH_ICON: "3rem",
	KEYBOARD_SHORTCUT: "b",
} as const;

export const SEO_DEFAULTS = {
	siteName: APP_NAME,
	siteUrl: "https://hypeterminal.xyz",
	defaultTitle: "HypeTerminal - Hyperliquid Trading Terminal",
	defaultDescription:
		"A professional trading terminal for Hyperliquid DEX. Trade perpetuals and spot markets with real-time data, advanced charting, and seamless wallet connectivity.",
	twitterHandle: "@hypeterminal",
	locale: "en_US",
	themeColor: "#0a0a0a",
} as const;

export const SEO_BASE_KEYWORDS = ["hyperliquid", "trading", "dex", "perpetuals", "crypto", "defi"] as const;

export const ROUTE_SEO = {
	TRADE: {
		title: "Trade",
		description:
			"Trade perpetuals and spot markets on Hyperliquid DEX with real-time charts, orderbook, and one-click order execution.",
		path: "/",
		keywords: ["trade", "orderbook", "chart", "perpetuals", "spot"],
	},
	PERP: {
		title: "Perpetuals Trading",
		description:
			"Trade perpetual futures on Hyperliquid DEX with up to 50x leverage, real-time charts, and advanced order types.",
		path: "/perp",
		keywords: ["perpetuals", "futures", "leverage", "trading"],
	},
	SPOT: {
		title: "Spot Trading",
		description: "Trade spot markets on Hyperliquid DEX with real-time orderbook, charts, and instant execution.",
		path: "/spot",
		keywords: ["spot", "trading", "exchange"],
	},
	BUILDERS_PERP: {
		title: "Builder Perpetuals",
		description: "Trade builder-deployed perpetual markets (HIP-3) on Hyperliquid DEX.",
		path: "/builders-perp",
		keywords: ["builders", "hip-3", "perpetuals", "community"],
	},
	COMPONENTS: {
		title: "Components",
		description:
			"UI component showcase for HypeTerminal design system. Explore buttons, badges, cards, and trading-specific components.",
		path: "/components",
		keywords: ["components", "design system", "ui"],
		noIndex: true,
	},
	NOT_FOUND: {
		title: "Page Not Found",
		description: "The page you are looking for does not exist.",
		path: "/404",
		noIndex: true,
	},
} as const;

export const CHART_LIBRARY_PATH = "/charting_library/";
export const CHART_TIME_FRAMES: TimeFrameItem[] = [
	{ text: "5y", resolution: "1W" as ResolutionString, description: "5 Years" },
	{ text: "1y", resolution: "1D" as ResolutionString, description: "1 Year" },
	{ text: "3m", resolution: "240" as ResolutionString, description: "3 Months" },
	{ text: "1m", resolution: "60" as ResolutionString, description: "1 Month" },
	{ text: "5d", resolution: "15" as ResolutionString, description: "5 Days" },
	{ text: "1d", resolution: "5" as ResolutionString, description: "1 Day" },
];

export const CHART_DEFAULT_SYMBOL = "AAVE/USDC";
export const CHART_DEFAULT_INTERVAL = "60";
export const CHART_DEFAULT_THEME = "dark" as const;
export const CHART_EXCHANGE = "Hyperliquid";
export const CHART_QUOTE_ASSET = DEFAULT_QUOTE_TOKEN;
export const CHART_SESSION = "24x7";
export const CHART_TIMEZONE = "Etc/UTC";
export const CHART_DEFAULT_PRICESCALE = 100;
export const CHART_SUPPORTED_RESOLUTIONS = [
	"1",
	"3",
	"5",
	"15",
	"30",
	"60",
	"120",
	"240",
	"480",
	"720",
	"1D",
	"1W",
	"1M",
] as unknown as ResolutionString[];
export const CHART_LOCALE = "en";
export const CHART_CUSTOM_FONT_FAMILY = "'IBM Plex Sans Variable', ui-sans-serif, system-ui, sans-serif";
export const CHART_ENABLED_FEATURES = [
	"side_toolbar_in_fullscreen_mode",
	"header_in_fullscreen_mode",
	"hide_last_na_study_output",
	"constraint_dialogs_to_chart",
	"dont_show_boolean_study_arguments",
	"hide_resolution_in_legend",
	"items_favoriting",
	"save_shortcut",
] as ChartingLibraryFeatureset[];
export const CHART_DISABLED_FEATURES = [
	"header_symbol_search",
	"header_quick_search",
	"header_compare",
	"display_market_status",
	"popup_hints",
	"header_saveload",
	"create_volume_indicator_by_default",
	"volume_force_overlay",
	"show_logo_on_all_charts",
	"caption_buttons_text_if_possible",
	"symbol_search_hot_key",
	"compare_symbol",
	"border_around_the_chart",
	"remove_library_container_border",
	"header_undo_redo",
	"go_to_date",
	"timezone_menu",
	"study_templates",
	"use_localstorage_for_settings",
	"save_chart_properties_to_local_storage",
	"countdown",
	"timeframes_toolbar",
	"main_series_scale_menu",
] as ChartingLibraryFeatureset[];
export const CHART_FAVORITE_INTERVALS = ["1", "5", "60", "240", "1D"] as ResolutionString[];
export const CHART_WIDGET_DEFAULTS = {
	AUTOSIZE: true,
	FULLSCREEN: false,
	DEBUG: false,
} as const;

export const CHART_DATAFEED_CONFIG = {
	SYMBOL_TYPE: "crypto",
	SYMBOL_TYPES: [{ name: "crypto", value: "crypto" }],
	DATA_STATUS: "streaming",
	FORMAT: "price",
	MIN_MOVEMENT: 1,
	VOLUME_PRECISION: 2,
	SEARCH_LIMIT: 50,
} as const;

export const MARKET_CATEGORY_LABELS = {
	all: "All",
	trending: "Hot",
	new: "New",
	defi: "DeFi",
	layer1: "L1",
	layer2: "L2",
	meme: "Meme",
} as const;

export const POSITIONS_TABS = [
	{ value: "balances", label: "Balances" },
	{ value: "positions", label: "Positions" },
	{ value: "orders", label: "Open Orders" },
	{ value: "twap", label: "TWAP" },
	{ value: "history", label: "Trade History" },
	{ value: "funding", label: "Funding History" },
	{ value: "orders-history", label: "Order History" },
] as const;

export const UI_TEXT = {
	COMMON: {
		CLOSE: "Close",
		LOADING: "Loading",
	},
	NOT_FOUND: {
		CODE: "404",
		TITLE: "Page not found",
		DESCRIPTION: "The page you are looking for does not exist.",
		CTA_LABEL: "Go to trading terminal",
		CTA_ARIA: "Go to trading terminal",
	},
	TOP_NAV: {
		BRAND_PREFIX: "HYPE",
		BRAND_SUFFIX: "TERMINAL",
		NAV_ITEMS: ["Trade", "Vaults", "Portfolio", "Staking", "Leaderboard"],
		MORE_LABEL: "More",
		MORE_ARIA: "More options",
		MORE_MENU_ITEMS: ["API", "Docs", "Support"],
		DEPOSIT_LABEL: "Deposit",
		NOTIFICATIONS_ARIA: "Notifications",
		SETTINGS_ARIA: "Settings",
	},
	GLOBAL_SETTINGS: {
		TITLE: "Settings",
		DESCRIPTION: "Global preferences for trading, chart, and orderbook.",
		SECTION_TRADING: "Trading",
		SECTION_CHART: "Chart",
		SECTION_ORDERBOOK: "Orderbook",
		SLIPPAGE_LABEL: "Max slippage",
		SLIPPAGE_HELP: "Used for market orders and position closes.",
		SLIPPAGE_UNIT: "bps",
		SHOW_ORDERS: "Show orders on chart",
		SHOW_POSITIONS: "Show positions on chart",
		SHOW_EXECUTIONS: "Show executions on chart",
		SHOW_SCANLINES: "Show chart scanlines",
		SHOW_ORDERBOOK_USD: "Show orderbook size in USD",
	},
	USER_MENU: {
		COPY_ADDRESS: "Copy Address",
		CONNECTING: "Connecting...",
		CONNECT_WALLET: "Connect Wallet",
		ADD_FUNDS: "Add funds",
		DISCONNECT: "Disconnect",
	},
	THEME_TOGGLE: {
		SWITCH_LIGHT: "Switch to light mode",
		SWITCH_DARK: "Switch to dark mode",
		LIGHT: "Light",
		DARK: "Dark",
	},
	BREADCRUMB: {
		ARIA_LABEL: "breadcrumb",
		ELLIPSIS_LABEL: "More",
	},
	PAGINATION: {
		ARIA_LABEL: "pagination",
		PREVIOUS_LABEL: "Previous",
		NEXT_LABEL: "Next",
		PREVIOUS_ARIA: "Go to previous page",
		NEXT_ARIA: "Go to next page",
		ELLIPSIS_LABEL: "More pages",
	},
	SIDEBAR: {
		TITLE: "Sidebar",
		DESCRIPTION: "Displays the mobile sidebar.",
		TOGGLE_LABEL: "Toggle Sidebar",
	},
	VIRTUAL_TABLE: {
		SORT_ARIA: (label: string) => `Sort by ${label}`,
	},
	FAVORITES: {
		EMPTY: "Select favorite markets",
		SELECT_MARKET_ARIA: (coin: string) => `Select ${coin} market`,
	},
	ORDERBOOK: {
		BOOK_LABEL: "Order Book",
		TRADES_LABEL: "Trades",
		ORDER_BOOK_ARIA: "Order Book",
		RECENT_TRADES_ARIA: "Recent Trades",
		SELECT_AGGREGATION_ARIA: "Select order book aggregation",
		AUTO_LABEL: "Auto",
		SIG_FIGS_SUFFIX: "sig figs",
		HEADER_PRICE: "Price",
		HEADER_SIZE: "Size",
		HEADER_TOTAL: "Total",
		FAILED: "Failed to load order book.",
		WAITING: "Waiting for order book...",
		SPREAD_LABEL: "Spread",
		WEBSOCKET_ERROR: "WebSocket error",
		APPROX_PREFIX: "\u2248 ",
	},
	TRADES: {
		HEADER_TIME: "Time",
		HEADER_PRICE: "Price",
		HEADER_SIZE: "Size",
		FAILED: "Failed to load trades.",
		WAITING: "Waiting for trades...",
		WEBSOCKET_ERROR: "WebSocket error",
	},
	FOOTER: {
		STATUS_CONNECTED: "Connected",
		BLOCK_LABEL: "Block:",
		GAS_LABEL: "Gas:",
		LATENCY_LABEL: "Latency:",
		BLOCK_VALUE: "18,942,103",
		GAS_VALUE: "24 gwei",
		LATENCY_VALUE: "12ms",
		VERSION: APP_VERSION,
	},
	ORDER_TOAST: {
		TITLE: "Order Queue",
		PENDING_LABEL: "pending",
		FAILED_LABEL: "failed",
		DISMISS_ARIA: "Dismiss",
		SIZE_LABEL: "Size",
		FILLED_SUFFIX: "% filled",
	},
	ACCOUNT_PANEL: {
		ARIA_EXPAND: "Expand account panel",
		ARIA_COLLAPSE: "Collapse account panel",
		TITLE: "Account",
		EQUITY_LABEL: "Equity",
		PNL_LABEL: "PNL",
		TAB_PERPS: "Perps",
		TAB_SPOT: "Spot",
		CONNECT: "Connect wallet to view account",
		LOADING: "Loading...",
		BALANCE_LABEL: "Balance",
		UNREALIZED_LABEL: "Unrealized PNL",
		AVAILABLE_LABEL: "Available",
		MARGIN_USED_LABEL: "Margin Used",
		MARGIN_RATIO_LABEL: "Margin Ratio",
		CROSS_LEVERAGE_LABEL: "Cross Leverage",
		DEPOSIT_LABEL: "Deposit",
		WITHDRAW_LABEL: "Withdraw",
	},
	BALANCES_TAB: {
		TITLE: "Account Balances",
		CONNECT: "Connect your wallet to view balances.",
		LOADING: "Loading balances...",
		FAILED: "Failed to load balances.",
		EMPTY: "No balances found. Deposit funds to start trading.",
		HEADER_ASSET: "Asset",
		HEADER_AVAILABLE: "Available",
		HEADER_IN_USE: "In Use",
		HEADER_TOTAL: "Total",
		HEADER_USD_VALUE: "USD Value",
		TYPE_PERP: "perp",
		TYPE_SPOT: "spot",
	},
	POSITIONS_TAB: {
		TITLE: "Active Positions",
		CONNECT: "Connect your wallet to view positions.",
		LOADING: "Loading positions...",
		FAILED: "Failed to load positions.",
		EMPTY: "No active positions.",
		HEADER_ASSET: "Asset",
		HEADER_SIZE: "Size",
		HEADER_VALUE: "Value",
		HEADER_ENTRY: "Entry",
		HEADER_MARK: "Mark",
		HEADER_PNL: "PNL",
		HEADER_LIQ: "Liq",
		HEADER_ACTIONS: "Actions",
		SIDE_LONG: "Long",
		SIDE_SHORT: "Short",
		ACTION_CLOSE: "Close",
		ACTION_CLOSING: "Closing...",
		ACTION_TPSL: "TP/SL",
		ARIA_CLOSE: "Close position",
		ARIA_TPSL: "Set TP/SL",
		ERROR_SIGNER: "Connect a wallet to manage positions.",
		ERROR_CLOSE_FALLBACK: "Unable to close position.",
	},
	ORDERS_TAB: {
		TITLE: "Open Orders",
		CONNECT: "Connect your wallet to view open orders.",
		LOADING: "Loading open orders...",
		FAILED: "Failed to load open orders.",
		EMPTY: "No open orders.",
		HEADER_ASSET: "Asset",
		HEADER_TYPE: "Type",
		HEADER_PRICE: "Price",
		HEADER_SIZE: "Size",
		HEADER_FILLED: "Filled",
		HEADER_STATUS: "Status",
		HEADER_ACTIONS: "Actions",
		SIDE_BUY: "buy",
		SIDE_SELL: "sell",
		TYPE_LIMIT: "limit",
		TYPE_LIMIT_RO: "limit ro",
		STATUS_OPEN: "open",
		ACTION_CANCEL: "Cancel",
		ACTION_CANCELING: "Canceling...",
		ACTION_CANCEL_SELECTED: "Cancel selected",
		ACTION_CANCEL_ALL: "Cancel all",
		ARIA_CANCEL: "Cancel order",
		ARIA_CANCEL_SELECTED: "Cancel selected orders",
		ARIA_CANCEL_ALL: "Cancel all orders",
		ARIA_SELECT_ALL: "Select all orders",
		ARIA_SELECT_ORDER: "Select order",
		ERROR_SIGNER: "Connect a wallet to manage orders.",
		ERROR_MARKET_UNAVAILABLE: "Market metadata unavailable.",
		ERROR_CANCEL_FALLBACK: "Unable to cancel orders.",
	},
	FUNDING_TAB: {
		TITLE: "Funding Payments",
		CONNECT: "Connect your wallet to view funding payments.",
		LOADING: "Loading funding history...",
		FAILED: "Failed to load funding history.",
		EMPTY: "No funding payments found.",
		HEADER_ASSET: "Asset",
		HEADER_POSITION: "Position",
		HEADER_RATE: "Rate",
		HEADER_PAYMENT: "Payment",
		HEADER_TIME: "Time",
		SIDE_LONG: "Long",
		SIDE_SHORT: "Short",
	},
	HISTORY_TAB: {
		TITLE: "Trade History",
		COUNT_LABEL: "Trades",
		CONNECT: "Connect your wallet to view trade history.",
		LOADING: "Loading trade history...",
		FAILED: "Failed to load trade history.",
		EMPTY: "No fills found.",
		HEADER_ASSET: "Asset",
		HEADER_TYPE: "Type",
		HEADER_PRICE: "Price",
		HEADER_SIZE: "Size",
		HEADER_FEE: "Fee",
		HEADER_PNL: "PNL",
		HEADER_TIME: "Time",
		SIDE_BUY: "buy",
		SIDE_SELL: "sell",
	},
	TWAP_TAB: {
		TITLE: "TWAP Orders",
		COUNT_LABEL: "Active",
		CONNECT: "Connect your wallet to view TWAP orders.",
		LOADING: "Loading TWAP orders...",
		FAILED: "Failed to load TWAP history.",
		EMPTY: "No TWAP orders found.",
		HEADER_ASSET: "Asset",
		HEADER_TOTAL_SIZE: "Total Size",
		HEADER_EXECUTED: "Executed",
		HEADER_AVG_PRICE: "Avg Price",
		HEADER_PROGRESS: "Progress",
		HEADER_STATUS: "Status",
		HEADER_ACTIONS: "Actions",
		SIDE_BUY: "buy",
		SIDE_SELL: "sell",
		STATUS_ACTIVE: "active",
		STATUS_COMPLETED: "completed",
		STATUS_CANCELLED: "cancelled",
		ACTION_CANCEL: "Cancel",
		ARIA_CANCEL: "Cancel TWAP order",
	},
	DEPOSIT_MODAL: {
		TITLE: "Deposit Funds",
		DESCRIPTION: "Transfer USDC to your Hyperliquid account to start trading.",
		BUTTON_LABEL: "Deposit on Hyperliquid",
		HELP_TEXT: "Bridge USDC from Arbitrum or other chains to your Hyperliquid account.",
	},
	WALLET_DIALOG: {
		TITLE: "Connect Wallet",
		EMPTY: "No wallets found",
	},
	ORDER_ENTRY: {
		ERROR_NOT_CONNECTED: "Not connected",
		ERROR_LOADING_WALLET: "Loading wallet...",
		ERROR_NO_BALANCE: "No balance",
		ERROR_NO_MARKET: "No market",
		ERROR_MARKET_NOT_READY: "Market not ready",
		ERROR_SIGNER_NOT_READY: "Signer not ready",
		ERROR_NO_MARK_PRICE: "No mark price",
		ERROR_LIMIT_PRICE: "Enter limit price",
		ERROR_SIZE: "Enter size",
		ERROR_MIN_NOTIONAL: "Min order value $10",
		ERROR_EXCEEDS_MAX: "Exceeds max size",
		BUTTON_CONNECT: "Connect Wallet",
		BUTTON_SWITCHING: "Switching...",
		BUTTON_SWITCH_CHAIN: "Switch to Arbitrum",
		BUTTON_DEPOSIT: "Deposit",
		BUTTON_SIGNING: "Signing...",
		BUTTON_LOADING: "Loading...",
		BUTTON_ENABLE_TRADING: "Enable Trading",
		BUTTON_BUY: "Buy",
		BUTTON_SELL: "Sell",
		MODE_CROSS: "Cross",
		MODE_ISOLATED: "Isolated",
		MODE_COMING_SOON: "Coming soon",
		LEVERAGE_ARIA: "Select leverage",
		ORDER_TYPE_MARKET: "Market",
		ORDER_TYPE_LIMIT: "Limit",
		ORDER_TYPE_STOP: "Stop",
		BUY_LABEL: "Long",
		SELL_LABEL: "Short",
		BUY_ARIA: "Buy Long",
		SELL_ARIA: "Sell Short",
		AVAILABLE_LABEL: "Available",
		DEPOSIT_LABEL: "Deposit",
		POSITION_LABEL: "Position",
		SIZE_LABEL: "Size",
		SIZE_MODE_TOGGLE_ARIA: "Toggle size mode",
		SIZE_MODE_USD: "USD",
		SIZE_MODE_FALLBACK: "---",
		INPUT_PLACEHOLDER: "0.00",
		SIZE_MAX_LABEL: "Max",
		PERCENT_ARIA: (percent: number) => `Set ${percent}%`,
		LIMIT_PRICE_LABEL: "Limit Price",
		MARK_PRICE_LABEL: "Mark",
		REDUCE_ONLY_LABEL: "Reduce Only",
		TPSL_LABEL: "TP/SL",
		TPSL_ARIA: "Take Profit / Stop Loss",
		SUMMARY_LIQ: "Liq. Price",
		SUMMARY_ORDER_VALUE: "Order Value",
		SUMMARY_MARGIN_REQ: "Margin Req.",
		SUMMARY_SLIPPAGE: "Slippage",
		SUMMARY_FEE: "Est. Fee",
		APPROVAL_ERROR_FALLBACK: "Failed to enable trading",
		ORDER_ERROR_FALLBACK: "Order failed",
	},
	MARKET_OVERVIEW: {
		LABEL_MARK: "MARK",
		LABEL_ORACLE: "ORACLE",
		LABEL_VOLUME: "VOL",
		LABEL_OPEN_INTEREST: "OI",
	},
	TOKEN_SELECTOR: {
		HEADER_MARKET: "Market",
		HEADER_PRICE: "Price",
		HEADER_CHANGE_24H: "24h Price",
		HEADER_OPEN_INTEREST: "Open Interest",
		HEADER_VOLUME: "Volume",
		HEADER_FUNDING: "Funding",
		ARIA_SELECT: "Select token",
		SEARCH_PLACEHOLDER: "Search markets...",
		FILTER_ARIA: (label: string) => `Filter by ${label}`,
		SORT_ARIA: (label: string) => `Sort by ${label}`,
		LOADING: "Loading markets...",
		EMPTY: "No markets found.",
		FAVORITE_ADD: "Add to favorites",
		FAVORITE_REMOVE: "Remove from favorites",
		NEW_BADGE: "NEW",
		MARKETS_SUFFIX: "markets",
		UPDATED_LIVE: "Updated live",
		SORTED_BY: (id: string) => `Sorted by ${id}`,
	},
	CHART_DATAFEED: {
		ERROR_UNKNOWN_SYMBOL: (symbol: string) => `Unknown symbol: ${symbol}`,
		ERROR_UNSUPPORTED_RESOLUTION: (resolution: string) => `Unsupported resolution: ${resolution}`,
	},
	TRADING_AGENT: {
		ERROR_WALLET_CLIENT_NOT_READY: "Wallet client not ready. Please wait and try again.",
		ERROR_WALLET_NOT_CONNECTED: "Wallet not connected",
		ERROR_CREATE_WALLET: "Failed to create wallet",
		AGENT_NAME: "HypeTerminal",
	},
	ERRORS: {
		GENERIC_FALLBACK: "Something went wrong.",
	},
} as const;
