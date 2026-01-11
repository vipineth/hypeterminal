import type { PerpMarketKey } from "./market-key";
import { makePerpMarketKey } from "./market-key";

export type PerpUniverseEntry = {
	name: string;
	szDecimals: number;
	maxLeverage: number;
	isDelisted?: true;
};

export type PerpMeta = {
	universe: PerpUniverseEntry[];
};

export type PerpMarketInfo = {
	kind: "perp";
	marketKey: PerpMarketKey;
	coin: string;
	assetIndex: number;
	szDecimals: number;
	maxLeverage: number;
	isDelisted: boolean;
};

export type PerpMarketRegistry = {
	kind: "perp";
	marketKeys: PerpMarketKey[];
	marketKeyToInfo: ReadonlyMap<PerpMarketKey, PerpMarketInfo>;
	coinToInfo: ReadonlyMap<string, PerpMarketInfo>;
	coinToAssetIndex: ReadonlyMap<string, number>;
	assetIndexToCoin: readonly string[];
};

export function buildPerpMarketRegistry(meta: PerpMeta): PerpMarketRegistry {
	const marketKeys: PerpMarketKey[] = [];
	const marketKeyToInfo = new Map<PerpMarketKey, PerpMarketInfo>();
	const coinToInfo = new Map<string, PerpMarketInfo>();
	const coinToAssetIndex = new Map<string, number>();
	const assetIndexToCoin: string[] = [];

	meta.universe.forEach((asset, assetIndex) => {
		const coin = asset.name;
		const marketKey = makePerpMarketKey(coin);
		const info: PerpMarketInfo = {
			kind: "perp",
			marketKey,
			coin,
			assetIndex,
			szDecimals: asset.szDecimals,
			maxLeverage: asset.maxLeverage,
			isDelisted: asset.isDelisted === true,
		};

		assetIndexToCoin[assetIndex] = coin;
		marketKeys.push(marketKey);
		marketKeyToInfo.set(marketKey, info);
		coinToInfo.set(coin, info);
		coinToAssetIndex.set(coin, assetIndex);
	});

	return {
		kind: "perp",
		marketKeys,
		marketKeyToInfo,
		coinToInfo,
		coinToAssetIndex,
		assetIndexToCoin,
	};
}
