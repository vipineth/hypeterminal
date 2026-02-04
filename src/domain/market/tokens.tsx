import { LightningIcon, TrendUpIcon } from "@phosphor-icons/react";
import { MARKET_CATEGORY_LABELS, TOKEN_ICON_BASE_URL } from "@/config/constants";
import { PERP_MARKET_NAME_SEPARATOR, SPOT_MARKET_NAME_SEPARATOR } from "./display";
import type { MarketKind } from "./types";

interface RawToken {
	name: string;
	fullName?: string | null;
}

const ASSET_REPLACEMENTS: Record<string, string> = {
	USDT0: "USDT",
};

const NO_SPOT_PREFIX_ASSETS: Record<string, string> = {
	USDC: "USDC",
};

export function getUnderlyingAsset(token: RawToken): string | undefined {
	if (ASSET_REPLACEMENTS[token.name]) {
		return ASSET_REPLACEMENTS[token.name];
	}
	if (token.fullName?.startsWith("Unit") && token.name.startsWith("U")) {
		return token.name.slice(1);
	}
	return token.name;
}

export function getTokenDisplayName(token: RawToken): string {
	return getUnderlyingAsset(token) ?? token.name;
}

export function getIconUrlFromPair(tokenName: string, kind?: MarketKind) {
	if (kind === "spot") {
		const [base] = tokenName.split(SPOT_MARKET_NAME_SEPARATOR);
		return `${TOKEN_ICON_BASE_URL}/${base}_spot.svg`;
	}

	if (kind === "perp" || kind === "builderPerp") {
		const [base] = tokenName.split(PERP_MARKET_NAME_SEPARATOR);
		return `${TOKEN_ICON_BASE_URL}/${base}.svg`;
	}

	return `${TOKEN_ICON_BASE_URL}/${tokenName}.svg`;
}

export function getIconUrlFromMarketName(tokenName: string, kind?: MarketKind) {
	if (kind === "spot") {
		if (NO_SPOT_PREFIX_ASSETS[tokenName]) {
			return `${TOKEN_ICON_BASE_URL}/${NO_SPOT_PREFIX_ASSETS[tokenName]}.svg`;
		}
		return `${TOKEN_ICON_BASE_URL}/${tokenName}_spot.svg`;
	}
	return `${TOKEN_ICON_BASE_URL}/${tokenName}.svg`;
}

export type MarketCategory = "all" | "trending" | "new" | "defi" | "layer1" | "layer2" | "meme";

export const marketCategories: { value: MarketCategory; label: string; icon: React.ReactNode }[] = [
	{ value: "all", label: MARKET_CATEGORY_LABELS.all, icon: null },
	{ value: "trending", label: MARKET_CATEGORY_LABELS.trending, icon: <TrendUpIcon className="size-2.5" /> },
	{ value: "new", label: MARKET_CATEGORY_LABELS.new, icon: <LightningIcon className="size-2.5" /> },
	{ value: "defi", label: MARKET_CATEGORY_LABELS.defi, icon: null },
	{ value: "layer1", label: MARKET_CATEGORY_LABELS.layer1, icon: null },
	{ value: "layer2", label: MARKET_CATEGORY_LABELS.layer2, icon: null },
	{ value: "meme", label: MARKET_CATEGORY_LABELS.meme, icon: null },
];

const categoryMapping: Record<string, MarketCategory[]> = {
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
