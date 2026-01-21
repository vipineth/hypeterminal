import { useMemo, useCallback } from "react";
import { makePerpMarketKey } from "../market-key";
import { useMarkets } from "./useMarkets";

export type PerpMarketInfo = {
	coin: string;
	assetIndex: number;
	szDecimals: number;
	maxLeverage: number;
	isDelisted: boolean;
	onlyIsolated: boolean;
};

export type PerpMarketsData = {
	markets: PerpMarketInfo[];
	coinToMarket: ReadonlyMap<string, PerpMarketInfo>;
	assetIndexToCoin: readonly string[];
};

export type UsePerpMarketsReturn = {
	data: PerpMarketsData | undefined;
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<unknown>;
	getAssetId: (coin: string) => number | undefined;
	getSzDecimals: (coin: string) => number | undefined;
	getMaxLeverage: (coin: string) => number | undefined;
	isDelisted: (coin: string) => boolean;
	getMarketInfo: (coin: string) => PerpMarketInfo | undefined;
};

export function usePerpMarkets(): UsePerpMarketsReturn {
	const {
		data: marketsData,
		isLoading,
		error,
		refetch,
		getAssetId: getAssetIdByKey,
		getSzDecimals: getSzDecimalsByKey,
		getMaxLeverage: getMaxLeverageByKey,
		isDelisted: isDelistedByKey,
		getMarketInfo: getMarketInfoByKey,
	} = useMarkets({ perp: true, spot: false, builderDexs: false, excludeDelisted: false });

	const perpMarketsData = useMemo((): PerpMarketsData | undefined => {
		if (!marketsData) return undefined;

		const markets: PerpMarketInfo[] = [];
		const coinToMarket = new Map<string, PerpMarketInfo>();
		const assetIndexToCoin: string[] = [];

		for (const market of marketsData.perpMarkets) {
			const info: PerpMarketInfo = {
				coin: market.coin,
				assetIndex: market.assetId,
				szDecimals: market.szDecimals,
				maxLeverage: market.maxLeverage,
				isDelisted: market.isDelisted,
				onlyIsolated: market.onlyIsolated,
			};

			markets.push(info);
			coinToMarket.set(market.coin, info);
			assetIndexToCoin[market.assetId] = market.coin;
		}

		return { markets, coinToMarket, assetIndexToCoin };
	}, [marketsData]);

	const getAssetId = useCallback(
		(coin: string): number | undefined => getAssetIdByKey(makePerpMarketKey(coin)),
		[getAssetIdByKey],
	);

	const getSzDecimals = useCallback(
		(coin: string): number | undefined => getSzDecimalsByKey(makePerpMarketKey(coin)),
		[getSzDecimalsByKey],
	);

	const getMaxLeverage = useCallback(
		(coin: string): number | undefined => getMaxLeverageByKey(makePerpMarketKey(coin)),
		[getMaxLeverageByKey],
	);

	const isDelisted = useCallback(
		(coin: string): boolean => isDelistedByKey(makePerpMarketKey(coin)),
		[isDelistedByKey],
	);

	const getMarketInfo = useCallback(
		(coin: string): PerpMarketInfo | undefined => {
			const info = getMarketInfoByKey(makePerpMarketKey(coin));
			if (!info || info.kind !== "perp") return undefined;
			return {
				coin: info.coin,
				assetIndex: info.assetId,
				szDecimals: info.szDecimals,
				maxLeverage: info.maxLeverage,
				isDelisted: info.isDelisted,
				onlyIsolated: info.onlyIsolated,
			};
		},
		[getMarketInfoByKey],
	);

	return {
		data: perpMarketsData,
		isLoading,
		error,
		refetch,
		getAssetId,
		getSzDecimals,
		getMaxLeverage,
		isDelisted,
		getMarketInfo,
	};
}
