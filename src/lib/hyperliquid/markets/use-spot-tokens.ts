import { useMarkets } from "./use-markets";

export function useSpotTokens() {
	const markets = useMarkets();

	return {
		tokens: markets.tokens,
		isLoading: markets.isLoading,
		error: markets.error,
		getToken: markets.getToken,
		getDisplayName(coin: string): string {
			return markets.getToken(coin)?.displayName ?? coin;
		},
		getIconUrl: (coin: string): string | undefined => {
			return markets.getToken(coin)?.iconUrl;
		},
	};
}

export type UseSpotTokensReturn = ReturnType<typeof useSpotTokens>;
