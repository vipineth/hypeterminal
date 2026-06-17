import { createContext, type ReactNode, use } from "react";
import { type UseMarketsInfoReturn, useMarketsInfoInternal } from "./useMarketsInfo";

const MarketsInfoContext = createContext<UseMarketsInfoReturn | null>(null);

interface MarketsInfoProviderProps {
	children: ReactNode;
}

export function MarketsInfoProvider({ children }: MarketsInfoProviderProps) {
	const marketsInfo = useMarketsInfoInternal({
		updateInterval: 5000,
		alwaysSubscribeAll: true,
	});

	return <MarketsInfoContext.Provider value={marketsInfo}>{children}</MarketsInfoContext.Provider>;
}

export function useMarketsInfoContext(): UseMarketsInfoReturn {
	const context = use(MarketsInfoContext);
	if (!context) {
		throw new Error("useMarketsInfoContext must be used within a MarketsInfoProvider");
	}
	return context;
}
