import { Star, TrendingUp, Zap } from "lucide-react";

export function getTokenIconUrl(token: string) {
	return `https://app.hyperliquid.xyz/coins/${token}.svg`;
}

export type MarketCategory = "all" | "favorites" | "trending" | "new" | "defi" | "layer1" | "layer2" | "meme";

export const marketCategories: { value: MarketCategory; label: string; icon: React.ReactNode }[] = [
	{ value: "all", label: "All", icon: null },
	{ value: "favorites", label: "Favorites", icon: <Star className="size-2.5" /> },
	{ value: "trending", label: "Hot", icon: <TrendingUp className="size-2.5" /> },
	{ value: "new", label: "New", icon: <Zap className="size-2.5" /> },
	{ value: "defi", label: "DeFi", icon: null },
	{ value: "layer1", label: "L1", icon: null },
	{ value: "layer2", label: "L2", icon: null },
	{ value: "meme", label: "Meme", icon: null },
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

export function isTokenInCategory(token: string, category: MarketCategory, favorites: string[] = []) {
	if (category === "all") return true;
	if (category === "favorites") return favorites.includes(token);
	return categoryMapping[token]?.includes(category) ?? false;
}
