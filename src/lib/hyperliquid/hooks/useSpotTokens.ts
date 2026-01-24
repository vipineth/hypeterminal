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

	/**
	 * Returns the EVM-compatible decimal precision for transfers.
	 *
	 * USE THIS FOR: Token transfers (sendAsset, spotSend), balance input validation
	 * DO NOT USE FOR: Order sizing (use market.szDecimals), price formatting (use szDecimalsToPriceDecimals)
	 *
	 * HyperCore uses `weiDecimals` internally, but when transferring to/from HyperEVM,
	 * the precision must match the linked ERC20 contract. The formula is:
	 *
	 *   EVM decimals = weiDecimals + evm_extra_wei_decimals
	 *
	 * Example: USDC has weiDecimals=8 on Core, but standard USDC is 6 decimals on EVM,
	 * so evm_extra_wei_decimals=-2, giving: 8 + (-2) = 6
	 *
	 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers
	 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/hyperliquid-improvement-proposals-hips/hip-1-native-token-standard
	 */
	const getTransferDecimals = useCallback(
		(coin: string): number => {
			const token = tokenMap.get(coin);
			if (!token) return 2;
			return token.weiDecimals + (token.evmContract?.evm_extra_wei_decimals ?? 0);
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
		getTransferDecimals,
		getIconUrl,
		isWrapped,
	};
}

export type UseSpotTokensReturn = ReturnType<typeof useSpotTokens>;
