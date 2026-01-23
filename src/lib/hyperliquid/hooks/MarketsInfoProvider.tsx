import { createContext, type ReactNode, useContext } from "react";
import { type UseMarketsInfoReturn, useMarketsInfoInternal } from "./useMarketsInfo";

const MarketsInfoContext = createContext<UseMarketsInfoReturn | null>(null);

interface MarketsInfoProviderProps {
	children: ReactNode;
}

export function MarketsInfoProvider({ children }: MarketsInfoProviderProps) {
	const marketsInfo = useMarketsInfoInternal({
		perp: true,
		spot: true,
		builderDexs: true,
		updateInterval: 5000,
	});

	return <MarketsInfoContext.Provider value={marketsInfo}>{children}</MarketsInfoContext.Provider>;
}

export function useMarketsInfoContext(): UseMarketsInfoReturn {
	const context = useContext(MarketsInfoContext);
	if (!context) {
		throw new Error("useMarketsInfoContext must be used within a MarketsInfoProvider");
	}
	return context;
}
