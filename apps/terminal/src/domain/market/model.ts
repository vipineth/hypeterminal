import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import {
	DEFAULT_LEVERAGE,
	DEFAULT_MAX_LEVERAGE,
	HL_PERP_PRICE_MAX_DECIMALS,
	HL_SPOT_PRICE_MAX_DECIMALS,
} from "@/config/trade";
import { BUILDER_DEX_SEPARATOR, PERP_MARKET_NAME_SEPARATOR, SPOT_MARKET_NAME_SEPARATOR } from "@/domain/market/display";
import { getIconUrlFromMarketName, getTokenDisplayNames, getUnderlyingAsset } from "@/domain/market/tokens";

type SdkPerpAsset = MetaResponse["universe"][number];
type SdkToken = SpotMetaResponse["tokens"][number];

declare const assetIdBrand: unique symbol;
export type AssetId = number & { readonly [assetIdBrand]: true };

export type MarginMode = NonNullable<SdkPerpAsset["marginMode"]>;

export interface SpotToken extends SdkToken {
	displayName: string;
	iconUrl: string;
	transferDecimals: number;
	isWrapped: boolean;
}

export interface Dex {
	name: string;
	index: number;
	collateralToken: SpotToken;
}

interface MarketBase {
	name: string;
	assetId: AssetId;
	szDecimals: number;
	priceDecimals: number;
	ctxIndex: number;
	quote: SpotToken;
	shortName: string;
	pairName: string;
	iconUrl: string;
}

interface PerpFields {
	dex: Dex;
	maxLeverage: number;
	marginMode: MarginMode | undefined;
	crossAllowed: boolean;
	isDelisted: boolean;
}

export interface PerpMarket extends MarketBase, PerpFields {
	kind: "perp";
}

export interface BuilderPerpMarket extends MarketBase, PerpFields {
	kind: "builderPerp";
}

export interface SpotMarket extends MarketBase {
	kind: "spot";
	base: SpotToken;
	isCanonical: boolean;
	isDelisted: false;
}

export type Market = PerpMarket | SpotMarket | BuilderPerpMarket;
export type PerpLikeMarket = PerpMarket | BuilderPerpMarket;
export type ListedMarket = Market & { isDelisted: false };

export type ParseIssue =
	| { kind: "spotTokenMissing"; pair: string; tokenIndex: number }
	| { kind: "collateralMissing"; dex: string; tokenIndex: number }
	| { kind: "dexMetaMissing"; dexIndex: number }
	| { kind: "dexSlotMismatch"; dexIndex: number; dex: string | null }
	| { kind: "assetPrefixMismatch"; dex: string; coin: string }
	| { kind: "duplicateTokenIndex"; tokenIndex: number }
	| { kind: "duplicateCoin"; coin: string }
	| { kind: "duplicateAssetId"; coin: string; assetId: number }
	| { kind: "unknownMarginMode"; coin: string; marginMode: string };

export interface MetaPayloads {
	perpDexs: PerpDexsResponse;
	allPerpMetas: MetaResponse[];
	spotMeta: SpotMetaResponse;
}

export interface MarketModel {
	markets: readonly Market[];
	listed: readonly ListedMarket[];
	dexes: readonly Dex[];
	tokens: readonly SpotToken[];
	byName: ReadonlyMap<string, Market>;
	tokenByIndex: ReadonlyMap<number, SpotToken>;
	tokenByName: ReadonlyMap<string, SpotToken>;
	issues: readonly ParseIssue[];
}

const SPOT_ASSET_ID_BASE = 10_000;
const BUILDER_PERP_ASSET_ID_BASE = 100_000;
const BUILDER_PERP_SLOTS_PER_DEX = 10_000;

export function isListed(market: Market): market is ListedMarket {
	return !market.isDelisted;
}

export function isPerpLike(market: Market): market is PerpLikeMarket {
	return market.kind !== "spot";
}

export function getMaxLeverage(market: Market | undefined): number {
	if (!market) return DEFAULT_MAX_LEVERAGE;
	return market.kind === "spot" ? 1 : market.maxLeverage;
}

export function getDefaultLeverage(market: Market | undefined): number {
	return Math.min(DEFAULT_LEVERAGE, getMaxLeverage(market));
}

export function parseMarkets({ perpDexs, allPerpMetas, spotMeta }: MetaPayloads): MarketModel {
	const issues: ParseIssue[] = [];
	const displayNames = getTokenDisplayNames(spotMeta.tokens);
	const tokens = spotMeta.tokens.map((token, index) => toSpotToken(token, displayNames[index]));
	const tokenByIndex = indexTokens(tokens, issues);
	const dexes = parseDexes(perpDexs, allPerpMetas, tokenByIndex, issues);

	const markets: Market[] = [];
	const byName = new Map<string, Market>();
	const spotIndices = new Set<number>();

	function add(market: Market) {
		if (byName.has(market.name)) {
			issues.push({ kind: "duplicateCoin", coin: market.name });
			return;
		}
		byName.set(market.name, market);
		markets.push(market);
	}

	const mainDex = dexes.find((dex) => dex.index === 0);
	if (mainDex) {
		allPerpMetas[0].universe.forEach((asset, position) => {
			if (asset.name.includes(BUILDER_DEX_SEPARATOR)) {
				issues.push({ kind: "assetPrefixMismatch", dex: mainDex.name, coin: asset.name });
				return;
			}
			add(toPerpMarket(asset, position, mainDex, issues));
		});
	}

	for (const pair of spotMeta.universe) {
		const base = tokenByIndex.get(pair.tokens[0]);
		const quote = tokenByIndex.get(pair.tokens[1]);
		if (!base || !quote) {
			for (const tokenIndex of pair.tokens) {
				if (!tokenByIndex.has(tokenIndex)) issues.push({ kind: "spotTokenMissing", pair: pair.name, tokenIndex });
			}
			continue;
		}
		if (spotIndices.has(pair.index)) {
			issues.push({ kind: "duplicateAssetId", coin: pair.name, assetId: SPOT_ASSET_ID_BASE + pair.index });
			continue;
		}
		spotIndices.add(pair.index);
		add({
			kind: "spot",
			name: pair.name,
			assetId: mintAssetId(SPOT_ASSET_ID_BASE + pair.index),
			szDecimals: base.szDecimals,
			priceDecimals: Math.max(0, HL_SPOT_PRICE_MAX_DECIMALS - base.szDecimals),
			ctxIndex: pair.index,
			base,
			quote,
			isCanonical: pair.isCanonical,
			isDelisted: false,
			shortName: base.displayName,
			pairName: `${base.displayName}${SPOT_MARKET_NAME_SEPARATOR}${quote.displayName}`,
			iconUrl: getIconUrlFromMarketName(getUnderlyingAsset(base) ?? base.name, "spot"),
		});
	}

	for (const dex of dexes) {
		if (dex.index === 0) continue;
		const prefix = `${dex.name}${BUILDER_DEX_SEPARATOR}`;
		allPerpMetas[dex.index].universe.forEach((asset, position) => {
			if (!asset.name.startsWith(prefix)) {
				issues.push({ kind: "assetPrefixMismatch", dex: dex.name, coin: asset.name });
				return;
			}
			add(toPerpMarket(asset, position, dex, issues));
		});
	}

	return {
		markets,
		listed: markets.filter(isListed),
		dexes,
		tokens,
		byName,
		tokenByIndex,
		tokenByName: new Map(tokens.map((token) => [token.name, token])),
		issues,
	};
}

export const EMPTY_MODEL: MarketModel = parseMarkets({
	perpDexs: [],
	allPerpMetas: [],
	spotMeta: { universe: [], tokens: [] },
});

function mintAssetId(value: number): AssetId {
	return value as AssetId;
}

function toSpotToken(token: SdkToken, displayName: string): SpotToken {
	const underlying = getUnderlyingAsset(token) ?? token.name;
	return {
		...token,
		displayName,
		iconUrl: getIconUrlFromMarketName(underlying, "spot"),
		transferDecimals: token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0),
		isWrapped: underlying !== token.name,
	};
}

function indexTokens(tokens: readonly SpotToken[], issues: ParseIssue[]): Map<number, SpotToken> {
	const byIndex = new Map<number, SpotToken>();
	for (const token of tokens) {
		if (byIndex.has(token.index)) {
			issues.push({ kind: "duplicateTokenIndex", tokenIndex: token.index });
			continue;
		}
		byIndex.set(token.index, token);
	}
	return byIndex;
}

function parseDexes(
	perpDexs: PerpDexsResponse,
	allPerpMetas: readonly MetaResponse[],
	tokenByIndex: ReadonlyMap<number, SpotToken>,
	issues: ParseIssue[],
): Dex[] {
	const dexes: Dex[] = [];
	const slots = Math.max(perpDexs.length, allPerpMetas.length);
	for (let index = 0; index < slots; index += 1) {
		const meta = allPerpMetas[index];
		const entry = perpDexs[index];
		if (index >= perpDexs.length || !meta) {
			issues.push({ kind: "dexMetaMissing", dexIndex: index });
			continue;
		}
		const name = entry?.name ?? "";
		if ((index === 0) !== (entry === null) || (index > 0 && name === "")) {
			issues.push({ kind: "dexSlotMismatch", dexIndex: index, dex: entry?.name ?? null });
			continue;
		}
		const collateralToken = tokenByIndex.get(meta.collateralToken);
		if (!collateralToken) {
			issues.push({ kind: "collateralMissing", dex: name, tokenIndex: meta.collateralToken });
			continue;
		}
		dexes.push({ name, index, collateralToken });
	}
	return dexes;
}

function toPerpMarket(asset: SdkPerpAsset, position: number, dex: Dex, issues: ParseIssue[]): PerpLikeMarket {
	const marginMode = normalizeMarginMode(asset, issues);
	const isMain = dex.index === 0;
	const shortName = isMain ? asset.name : asset.name.slice(dex.name.length + BUILDER_DEX_SEPARATOR.length);
	return {
		kind: isMain ? "perp" : "builderPerp",
		name: asset.name,
		assetId: mintAssetId(
			isMain ? position : BUILDER_PERP_ASSET_ID_BASE + dex.index * BUILDER_PERP_SLOTS_PER_DEX + position,
		),
		szDecimals: asset.szDecimals,
		priceDecimals: Math.max(0, HL_PERP_PRICE_MAX_DECIMALS - asset.szDecimals),
		ctxIndex: position,
		quote: dex.collateralToken,
		shortName,
		pairName: `${shortName}${PERP_MARKET_NAME_SEPARATOR}${dex.collateralToken.displayName}`,
		iconUrl: getIconUrlFromMarketName(asset.name, isMain ? "perp" : "builderPerp"),
		dex,
		maxLeverage: asset.maxLeverage,
		marginMode,
		crossAllowed: marginMode === undefined,
		isDelisted: asset.isDelisted === true,
	};
}

function normalizeMarginMode(asset: SdkPerpAsset, issues: ParseIssue[]): MarginMode | undefined {
	const mode: string | undefined = asset.marginMode;
	if (mode === undefined) return asset.onlyIsolated === true ? "noCross" : undefined;
	if (mode === "noCross" || mode === "strictIsolated") return mode;
	issues.push({ kind: "unknownMarginMode", coin: asset.name, marginMode: mode });
	return "noCross";
}
