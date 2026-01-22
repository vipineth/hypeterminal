import type { Address } from "viem";
import type { MarketKind, PerpMarketKey, SpotMarketKey, BuilderPerpMarketKey } from "../market-key";

export type BaseMarketInfo = {
	marketKey: string;
	coin: string;
	assetId: number;
	szDecimals: number;
	isDelisted: boolean;
};

export type PerpMarketInfo = BaseMarketInfo & {
	kind: "perp";
	marketKey: PerpMarketKey;
	maxLeverage: number;
	onlyIsolated: boolean;
	marginTableId: number;
};

export type SpotMarketInfo = BaseMarketInfo & {
	kind: "spot";
	marketKey: SpotMarketKey;
	baseToken: string;
	quoteToken: string;
	spotPairId: string;
	pairIndex: number;
	baseTokenIndex: number;
	quoteTokenIndex: number;
};

export type BuilderPerpMarketInfo = BaseMarketInfo & {
	kind: "builderPerp";
	marketKey: BuilderPerpMarketKey;
	dex: string;
	dexFullName: string;
	dexIndex: number;
	maxLeverage: number;
	onlyIsolated: boolean;
	marginTableId: number;
};

export type MarketInfo = PerpMarketInfo | SpotMarketInfo | BuilderPerpMarketInfo;

export type DexInfo = {
	name: string;
	fullName: string;
	deployer: Address;
	oracleUpdater: Address | null;
	feeRecipient: Address | null;
	dexIndex: number;
};

export type MarketsData = {
	markets: MarketInfo[];
	perpMarkets: PerpMarketInfo[];
	spotMarkets: SpotMarketInfo[];
	builderMarkets: BuilderPerpMarketInfo[];
	byMarketKey: ReadonlyMap<string, MarketInfo>;
	byCoin: ReadonlyMap<string, MarketInfo>;
	byAssetId: ReadonlyMap<number, MarketInfo>;
	dexes: ReadonlyMap<string, DexInfo>;
};

export type UseMarketsOptions = {
	perp?: boolean;
	spot?: boolean;
	builderDexs?: string[] | boolean;
	excludeDelisted?: boolean;
};

export type UseMarketsReturn = {
	data: MarketsData | undefined;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<unknown>;
	getAssetId: (marketKey: string) => number | undefined;
	getSzDecimals: (marketKey: string) => number | undefined;
	getMaxLeverage: (marketKey: string) => number | undefined;
	getMarketInfo: (marketKey: string) => MarketInfo | undefined;
	isDelisted: (marketKey: string) => boolean;
	getSpotPairId: (marketKey: string) => string | undefined;
	getDex: (marketKey: string) => string | undefined;
	availableDexs: string[];
	getMarketsForDex: (dex: string) => BuilderPerpMarketInfo[];
	getDexInfo: (dex: string) => DexInfo | undefined;
};

export function isPerpMarketInfo(info: MarketInfo): info is PerpMarketInfo {
	return info.kind === "perp";
}

export function isSpotMarketInfo(info: MarketInfo): info is SpotMarketInfo {
	return info.kind === "spot";
}

export function isBuilderPerpMarketInfo(info: MarketInfo): info is BuilderPerpMarketInfo {
	return info.kind === "builderPerp";
}

export function getMarketKind(info: MarketInfo): MarketKind {
	return info.kind;
}
