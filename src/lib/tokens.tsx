import { TrendingUp, Zap } from "lucide-react";
import { MARKET_CATEGORY_LABELS, TOKEN_ICON_BASE_URL } from "@/config/constants";
import type { MarketKind } from "@/lib/hyperliquid/market-key";
import type { SpotToken } from "./hyperliquid";

export const PERP_NAME_SEPARATOR = "-";
export const SPOT_NAME_SEPARATOR = "/";

export function getUnderlyingAsset(token: SpotToken): string | undefined {
	// Unit Protocol tokens
	if (token.fullName?.startsWith("Unit")) {
		return token.name.replace("U", "");
	}
}

export function isMarketSpot(marketName: string) {
	return marketName.startsWith("@");
}

export function isMarketBuilderPerp(marketName: string) {
	return marketName.includes(":");
}

export function getIconUrlFromPair(tokenName: string, kind?: MarketKind) {
	if (kind === "spot") {
		const [base] = tokenName.split(SPOT_NAME_SEPARATOR);
		return `${TOKEN_ICON_BASE_URL}/${base}_spot.svg`;
	}

	if (kind === "perp" || kind === "builderPerp") {
		const [base] = tokenName.split(PERP_NAME_SEPARATOR);
		return `${TOKEN_ICON_BASE_URL}/${base}.svg`;
	}

	return `${TOKEN_ICON_BASE_URL}/${tokenName}.svg`;
}

export function getIconUrlFromToken(tokenName: string, kind?: MarketKind) {
	if (kind === "spot") {
		return `${TOKEN_ICON_BASE_URL}/${tokenName}_spot.svg`;
	}

	return `${TOKEN_ICON_BASE_URL}/${tokenName}.svg`;
}

export type MarketCategory = "all" | "trending" | "new" | "defi" | "layer1" | "layer2" | "meme";

export const marketCategories: { value: MarketCategory; label: string; icon: React.ReactNode }[] = [
	{ value: "all", label: MARKET_CATEGORY_LABELS.all, icon: null },
	{ value: "trending", label: MARKET_CATEGORY_LABELS.trending, icon: <TrendingUp className="size-2.5" /> },
	{ value: "new", label: MARKET_CATEGORY_LABELS.new, icon: <Zap className="size-2.5" /> },
	{ value: "defi", label: MARKET_CATEGORY_LABELS.defi, icon: null },
	{ value: "layer1", label: MARKET_CATEGORY_LABELS.layer1, icon: null },
	{ value: "layer2", label: MARKET_CATEGORY_LABELS.layer2, icon: null },
	{ value: "meme", label: MARKET_CATEGORY_LABELS.meme, icon: null },
];

export const categoryMapping: Record<string, MarketCategory[]> = {
	BTC: ["layer1", "trending"],
	ETH: ["layer1", "defi", "trending"],
	SOL: ["layer1", "trending"],
	AVAX: ["layer1"],
	NEAR: ["layer1"],
	ATOM: ["layer1"],
	DOT: ["layer1"],
	ADA: ["layer1"],
	APT: ["layer1", "new"],
	SUI: ["layer1", "new"],
	SEI: ["layer1", "new"],
	ARB: ["layer2", "defi"],
	OP: ["layer2", "defi"],
	MATIC: ["layer2"],
	BASE: ["layer2", "new"],
	AAVE: ["defi"],
	UNI: ["defi"],
	LINK: ["defi"],
	MKR: ["defi"],
	SNX: ["defi"],
	CRV: ["defi"],
	DOGE: ["meme", "trending"],
	SHIB: ["meme"],
	PEPE: ["meme", "trending"],
	BONK: ["meme"],
	WIF: ["meme", "new"],
	FLOKI: ["meme"],
};

export function isTokenInCategory(token: string, category: MarketCategory) {
	if (category === "all") return true;
	return categoryMapping[token]?.includes(category) ?? false;
}
