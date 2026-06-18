import { APP_NAME } from "./app";

export const SEO_DEFAULTS = {
	siteName: APP_NAME,
	siteUrl: "https://app.hypeterminal.com",
	defaultTitle: "HypeTerminal - Hyperliquid Trading Terminal",
	defaultDescription:
		"A professional trading terminal for Hyperliquid DEX. Trade perpetuals and spot markets with real-time data, advanced charting, and seamless wallet connectivity.",
	twitterHandle: "@hypeterminal",
	locale: "en_US",
	// meta theme-color needs a literal CSS color value (tag consumer reads from HTML, not CSS vars)
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
