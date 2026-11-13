import { type Markets, type MarketSpotToken as SpotToken, type UnifiedMarket, useInfo } from "@hypeterminal/hl-react";
import type { SpotMetaResponse } from "@nktkas/hyperliquid";
import { createContext, type ReactNode, use, useMemo } from "react";
import { type MarketModel, parseMarkets } from "@/domain/market/model";

const META_STALE_TIME_MS = 30 * 60 * 1_000;
const DEXS_STALE_TIME_MS = 5 * 60 * 1_000;

const EMPTY_SPOT_META: SpotMetaResponse = { universe: [], tokens: [] };

function createMarkets(model: MarketModel, isLoading: boolean, error: Error | null): Markets {
	return {
		all: model.all,
		perp: model.perp,
		spot: model.spot,
		builderPerp: model.builderPerp,
		tokens: model.tokens,
		isLoading,
		error,

		getMarket(coin: string): UnifiedMarket | undefined {
			return model.byName.get(coin);
		},

		getToken(name: string): SpotToken | undefined {
			return model.tokenByName.get(name);
		},

		getSzDecimals(coin: string): number {
			return model.byName.get(coin)?.szDecimals ?? 4;
		},

		getAssetId(coin: string): number | undefined {
			return model.byName.get(coin)?.assetId;
		},
	};
}

const MarketsContext = createContext<Markets | null>(null);

interface Props {
	children: ReactNode;
}

// Deliberately separate from MarketsInfoProvider. This holds static market metadata
// (never ticks) so its ~14 direct useMarkets() consumers are isolated from the 5s
// live-ctx re-render. It also mounts above ClientOnly/ExchangeScope (no scope dep),
// which the live provider cannot. Do not merge the two — see MarketsInfoProvider.
export function MarketsProvider({ children }: Props) {
	const {
		data: spotMeta,
		isLoading: spotLoading,
		error: spotError,
	} = useInfo("spotMeta", undefined, { refetchInterval: Infinity, staleTime: META_STALE_TIME_MS, persist: true });

	const {
		data: perpDexs,
		isLoading: dexsLoading,
		error: dexsError,
	} = useInfo("perpDexs", undefined, { refetchInterval: Infinity, staleTime: DEXS_STALE_TIME_MS, persist: true });

	const {
		data: allPerpMetas,
		isLoading: allMetasLoading,
		error: allMetasError,
	} = useInfo("allPerpMetas", undefined, { refetchInterval: Infinity, staleTime: META_STALE_TIME_MS, persist: true });

	const isLoading = spotLoading || dexsLoading || allMetasLoading;
	const error = spotError ?? dexsError ?? allMetasError ?? null;

	const model = useMemo(
		() =>
			parseMarkets({
				spotMeta: spotMeta ?? EMPTY_SPOT_META,
				perpDexs: perpDexs ?? [],
				allPerpMetas: allPerpMetas ?? [],
			}),
		[spotMeta, perpDexs, allPerpMetas],
	);
	const markets = useMemo(() => createMarkets(model, isLoading, error), [model, isLoading, error]);

	return <MarketsContext.Provider value={markets}>{children}</MarketsContext.Provider>;
}

export function useMarkets(): Markets {
	const context = use(MarketsContext);

	if (!context) {
		throw new Error("useMarkets must be used within a MarketsProvider");
	}
	return context;
}
