import type { SpotMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";

export interface SwapableToken {
	name: string;
	szDecimals: number;
}

export function getSwappableTokens(spotMarkets: SpotMarketInfo[]): SwapableToken[] {
	const tokenMap = new Map<string, SwapableToken>();

	for (const market of spotMarkets) {
		if (market.tokensInfo.length < 2) continue;

		const baseToken = market.tokensInfo[0];
		const quoteToken = market.tokensInfo[1];

		if (baseToken?.name && !tokenMap.has(baseToken.name)) {
			tokenMap.set(baseToken.name, {
				name: baseToken.name,
				szDecimals: baseToken.szDecimals,
			});
		}

		if (quoteToken?.name && !tokenMap.has(quoteToken.name)) {
			tokenMap.set(quoteToken.name, {
				name: quoteToken.name,
				szDecimals: quoteToken.szDecimals,
			});
		}
	}

	return Array.from(tokenMap.values()).sort((a, b) => {
		if (a.name === "USDC") return -1;
		if (b.name === "USDC") return 1;
		return a.name.localeCompare(b.name);
	});
}

export function getAvailablePairTokens(
	token: string,
	spotMarkets: SpotMarketInfo[],
): SwapableToken[] {
	const tokenMap = new Map<string, SwapableToken>();

	for (const market of spotMarkets) {
		if (market.tokensInfo.length < 2) continue;

		const baseToken = market.tokensInfo[0];
		const quoteToken = market.tokensInfo[1];

		if (baseToken?.name === token && quoteToken?.name) {
			if (!tokenMap.has(quoteToken.name)) {
				tokenMap.set(quoteToken.name, {
					name: quoteToken.name,
					szDecimals: quoteToken.szDecimals,
				});
			}
		}

		if (quoteToken?.name === token && baseToken?.name) {
			if (!tokenMap.has(baseToken.name)) {
				tokenMap.set(baseToken.name, {
					name: baseToken.name,
					szDecimals: baseToken.szDecimals,
				});
			}
		}
	}

	return Array.from(tokenMap.values()).sort((a, b) => {
		if (a.name === "USDC") return -1;
		if (b.name === "USDC") return 1;
		return a.name.localeCompare(b.name);
	});
}

export function findSpotPair(
	tokenA: string,
	tokenB: string,
	spotMarkets: SpotMarketInfo[],
): SpotMarketInfo | null {
	for (const market of spotMarkets) {
		if (market.tokensInfo.length < 2) continue;

		const baseToken = market.tokensInfo[0]?.name;
		const quoteToken = market.tokensInfo[1]?.name;

		if (
			(baseToken === tokenA && quoteToken === tokenB) ||
			(baseToken === tokenB && quoteToken === tokenA)
		) {
			return market;
		}
	}
	return null;
}

export function getSwapSide(fromToken: string, spotMarket: SpotMarketInfo): boolean {
	const baseToken = spotMarket.tokensInfo[0]?.name;
	return fromToken !== baseToken;
}
