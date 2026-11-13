import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import type { SpotMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { SpotToken } from "@/lib/hyperliquid/markets";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";

interface SwapQuoteInput {
	amount: string;
	markPx: string | undefined;
	szDecimals: number;
	isBuying: boolean;
}

interface SwapQuote {
	orderSize: number;
	estimatedReceive: number;
}

export function getAvailablePairTokens(token: string, spotMarkets: SpotMarketInfo[]): SpotToken[] {
	const tokenMap = new Map<string, SpotToken>();

	for (const market of spotMarkets) {
		if (market.tokensInfo.length < 2) continue;

		const baseToken = market.tokensInfo[0];
		const quoteToken = market.tokensInfo[1];

		if (baseToken?.name === token && quoteToken) {
			if (!tokenMap.has(quoteToken.name)) {
				tokenMap.set(quoteToken.name, quoteToken);
			}
		}

		if (quoteToken?.name === token && baseToken) {
			if (!tokenMap.has(baseToken.name)) {
				tokenMap.set(baseToken.name, baseToken);
			}
		}
	}

	return Array.from(tokenMap.values()).sort((a, b) => {
		if (a.name === DEFAULT_QUOTE_TOKEN) return -1;
		if (b.name === DEFAULT_QUOTE_TOKEN) return 1;
		return a.displayName.localeCompare(b.displayName);
	});
}

export function findSpotPair(tokenA: string, tokenB: string, spotMarkets: SpotMarketInfo[]): SpotMarketInfo | null {
	for (const market of spotMarkets) {
		if (market.tokensInfo.length < 2) continue;

		const baseToken = market.tokensInfo[0]?.name;
		const quoteToken = market.tokensInfo[1]?.name;

		if ((baseToken === tokenA && quoteToken === tokenB) || (baseToken === tokenB && quoteToken === tokenA)) {
			return market;
		}
	}
	return null;
}

export function getSwapSide(fromToken: string, spotMarket: SpotMarketInfo): boolean {
	const baseToken = spotMarket.tokensInfo[0]?.name;
	return fromToken !== baseToken;
}

export function getSwapQuote({ amount, markPx, isBuying }: SwapQuoteInput): SwapQuote {
	const amountValue = toNumber(amount) ?? 0;
	const mark = toNumberOrZero(markPx);
	if (amountValue <= 0 || mark <= 0) return { orderSize: 0, estimatedReceive: 0 };

	if (isBuying) {
		const size = amountValue / mark;
		return { orderSize: size, estimatedReceive: size };
	}
	return { orderSize: amountValue, estimatedReceive: amountValue * mark };
}
