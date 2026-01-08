import { useMemo } from "react";
import { useInfoMeta } from "./info/useInfoMeta";

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
	const { data: meta, isLoading, error, refetch } = useInfoMeta({});

	const marketsData = useMemo((): PerpMarketsData | undefined => {
		if (!meta?.universe) return undefined;

		const markets: PerpMarketInfo[] = [];
		const coinToMarket = new Map<string, PerpMarketInfo>();
		const assetIndexToCoin: string[] = [];

		meta.universe.forEach((asset, index) => {
			const info: PerpMarketInfo = {
				coin: asset.name,
				assetIndex: index,
				szDecimals: asset.szDecimals,
				maxLeverage: asset.maxLeverage,
				isDelisted: asset.isDelisted === true,
				onlyIsolated: asset.onlyIsolated === true,
			};

			markets.push(info);
			coinToMarket.set(asset.name, info);
			assetIndexToCoin[index] = asset.name;
		});

		return { markets, coinToMarket, assetIndexToCoin };
	}, [meta]);

	const getAssetId = useMemo(() => {
		return (coin: string): number | undefined => {
			return marketsData?.coinToMarket.get(coin)?.assetIndex;
		};
	}, [marketsData]);

	const getSzDecimals = useMemo(() => {
		return (coin: string): number | undefined => {
			return marketsData?.coinToMarket.get(coin)?.szDecimals;
		};
	}, [marketsData]);

	const getMaxLeverage = useMemo(() => {
		return (coin: string): number | undefined => {
			return marketsData?.coinToMarket.get(coin)?.maxLeverage;
		};
	}, [marketsData]);

	const isDelisted = useMemo(() => {
		return (coin: string): boolean => {
			return marketsData?.coinToMarket.get(coin)?.isDelisted ?? false;
		};
	}, [marketsData]);

	const getMarketInfo = useMemo(() => {
		return (coin: string): PerpMarketInfo | undefined => {
			return marketsData?.coinToMarket.get(coin);
		};
	}, [marketsData]);

	return {
		data: marketsData,
		isLoading,
		error: error ?? null,
		refetch,
		getAssetId,
		getSzDecimals,
		getMaxLeverage,
		isDelisted,
		getMarketInfo,
	};
}
