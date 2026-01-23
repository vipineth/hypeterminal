import { useCallback, useMemo } from "react";
import { getIconUrlFromToken, getUnderlyingAsset } from "@/lib/tokens";
import { useInfoSpotMeta } from "./info/useInfoSpotMeta";
import type { SpotToken } from "./useMarkets";

export function useSpotTokens() {
	const { data: spotMeta, isLoading, error } = useInfoSpotMeta({ refetchInterval: Infinity });

	const tokens = useMemo((): SpotToken[] => {
		return spotMeta?.tokens ?? [];
	}, [spotMeta?.tokens]);

	const tokenMap = useMemo((): Map<string, SpotToken> => {
		const map = new Map<string, SpotToken>();
		for (const token of tokens) {
			map.set(token.name, token);
		}
		return map;
	}, [tokens]);

	const getToken = useCallback(
		(coin: string): SpotToken | undefined => {
			return tokenMap.get(coin);
		},
		[tokenMap],
	);

	const getDisplayName = useCallback(
		(coin: string): string => {
			const token = tokenMap.get(coin);
			if (!token) return coin;
			return getUnderlyingAsset(token) ?? token.name;
		},
		[tokenMap],
	);

	const getDecimals = useCallback(
		(coin: string): number => {
			const token = tokenMap.get(coin);
			if (!token) return 2;
			return token.szDecimals - (token.evmContract?.evm_extra_wei_decimals ?? 0);
		},
		[tokenMap],
	);

	const getIconUrl = useCallback(
		(coin: string): string => {
			const displayName = getDisplayName(coin);
			return getIconUrlFromToken(displayName, "spot");
		},
		[getDisplayName],
	);

	const isWrapped = useCallback(
		(coin: string): boolean => {
			const token = tokenMap.get(coin);
			if (!token) return false;
			return !!getUnderlyingAsset(token);
		},
		[tokenMap],
	);

	return {
		tokens,
		tokenMap,
		isLoading,
		error,
		getToken,
		getDisplayName,
		getDecimals,
		getIconUrl,
		isWrapped,
	};
}

export type UseSpotTokensReturn = ReturnType<typeof useSpotTokens>;
