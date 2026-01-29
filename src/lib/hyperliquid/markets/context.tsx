import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useInfoAllPerpMetas } from "../hooks/info/useInfoAllPerpMetas";
import { useInfoMeta } from "../hooks/info/useInfoMeta";
import { useInfoPerpDexs } from "../hooks/info/useInfoPerpDexs";
import { useInfoSpotMeta } from "../hooks/info/useInfoSpotMeta";
import { createEmptyMarkets, createMarkets } from "./create-markets";
import type { Markets } from "./types";

const MarketsContext = createContext<Markets | null>(null);

interface Props {
	children: ReactNode;
}

export function MarketsProvider({ children }: Props) {
	const {
		data: perpMeta,
		isLoading: perpLoading,
		error: perpError,
	} = useInfoMeta({}, { refetchInterval: Infinity });

	const {
		data: spotMeta,
		isLoading: spotLoading,
		error: spotError,
	} = useInfoSpotMeta({ refetchInterval: Infinity });

	const {
		data: perpDexs,
		isLoading: dexsLoading,
		error: dexsError,
	} = useInfoPerpDexs({ refetchInterval: Infinity });

	const {
		data: allPerpMetas,
		isLoading: allMetasLoading,
		error: allMetasError,
	} = useInfoAllPerpMetas({ refetchInterval: Infinity });

	const isLoading = perpLoading || spotLoading || dexsLoading || allMetasLoading;
	const error = perpError ?? spotError ?? dexsError ?? allMetasError ?? null;

	const markets = useMemo(
		() =>
			createMarkets({
				perpMeta,
				spotMeta,
				allPerpMetas,
				perpDexs,
				isLoading,
				error,
			}),
		[perpMeta, spotMeta, allPerpMetas, perpDexs, isLoading, error],
	);

	return <MarketsContext.Provider value={markets}>{children}</MarketsContext.Provider>;
}

export function useMarketsContext(): Markets {
	const context = useContext(MarketsContext);
	if (!context) {
		throw new Error("useMarketsContext must be used within a MarketsProvider");
	}
	return context;
}

export function useMarketsContextOptional(): Markets {
	const context = useContext(MarketsContext);
	return context ?? createEmptyMarkets();
}
