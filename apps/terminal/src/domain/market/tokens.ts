import { DEFAULT_QUOTE_TOKEN, TOKEN_ICON_BASE_URL, USDC_TRANSFER_DECIMALS } from "@/config/app";
import { ASSET_REPLACEMENTS, categoryMapping, type MarketCategory, NO_SPOT_PREFIX_ASSETS } from "@/config/tokens";
import type { SpotToken } from "./model";
import type { MarketKind } from "./types";

interface RawToken {
	name: string;
	fullName?: string | null;
}

export function getUnderlyingAsset(token: RawToken): string | undefined {
	if (ASSET_REPLACEMENTS[token.name]) {
		return ASSET_REPLACEMENTS[token.name];
	}
	if (token.fullName?.startsWith("Unit") && token.name.startsWith("U")) {
		return token.name.slice(1);
	}
	return token.name;
}

export function getTokenDisplayNames(tokens: readonly RawToken[]): string[] {
	const realNames = new Set(tokens.map((token) => token.name));
	const aliases = tokens.map((token) => getUnderlyingAsset(token) ?? token.name);
	const claims = new Map<string, number>();
	for (const alias of aliases) claims.set(alias, (claims.get(alias) ?? 0) + 1);
	return tokens.map((token, index) => {
		const alias = aliases[index];
		if (alias === token.name || realNames.has(alias) || claims.get(alias) !== 1) return token.name;
		return alias;
	});
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

export function getTokenTransferDecimals(token: SpotToken | undefined): number {
	if (token?.name === DEFAULT_QUOTE_TOKEN) return USDC_TRANSFER_DECIMALS;
	return token?.transferDecimals ?? USDC_TRANSFER_DECIMALS;
}

export function isTokenInCategory(token: string, category: MarketCategory) {
	if (category === "all") return true;
	return categoryMapping[token]?.includes(category) ?? false;
}

export type { MarketCategory };
