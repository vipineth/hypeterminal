import type { MarketSpotToken as SpotToken } from "@hypeterminal/hl-react";
import { useMemo } from "react";
import { useMarkets } from "./use-markets";

export function useSpotTokens() {
	const markets = useMarkets();

	const tokenByName = useMemo(() => {
		const map = new Map<string, SpotToken>();
		for (const token of markets.tokens) {
			map.set(token.name, token);
		}
		return map;
	}, [markets.tokens]);

	return {
		tokens: markets.tokens,
		isLoading: markets.isLoading,
		error: markets.error,
		getToken(coin: string): SpotToken | undefined {
			return tokenByName.get(coin);
		},
	};
}
