import Big from "big.js";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import type { SpotToken } from "@/domain/market/model";
import type { SpotMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toBig } from "@/lib/trade/numbers";

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

	for (const { base, quote } of spotMarkets) {
		if (base.name === token && !tokenMap.has(quote.name)) tokenMap.set(quote.name, quote);
		if (quote.name === token && !tokenMap.has(base.name)) tokenMap.set(base.name, base);
	}

	return Array.from(tokenMap.values()).sort((a, b) => {
		if (a.name === DEFAULT_QUOTE_TOKEN) return -1;
		if (b.name === DEFAULT_QUOTE_TOKEN) return 1;
		return a.displayName.localeCompare(b.displayName);
	});
}

export function findSpotPair(tokenA: string, tokenB: string, spotMarkets: SpotMarketInfo[]): SpotMarketInfo | null {
	for (const market of spotMarkets) {
		const baseToken = market.base.name;
		const quoteToken = market.quote.name;

		if ((baseToken === tokenA && quoteToken === tokenB) || (baseToken === tokenB && quoteToken === tokenA)) {
			return market;
		}
	}
	return null;
}

export function getSwapSide(fromToken: string, spotMarket: SpotMarketInfo): boolean {
	return fromToken !== spotMarket.base.name;
}

export function getSwapQuote({ amount, markPx, szDecimals, isBuying }: SwapQuoteInput): SwapQuote {
	const amountBig = toBig(amount);
	const mark = toBig(markPx);
	if (!amountBig || !mark || amountBig.lte(0) || mark.lte(0)) return { orderSize: 0, estimatedReceive: 0 };

	if (isBuying) {
		const size = amountBig.div(mark).round(szDecimals, Big.roundDown).toNumber();
		return { orderSize: size, estimatedReceive: size };
	}
	const size = amountBig.round(szDecimals, Big.roundDown);
	return { orderSize: size.toNumber(), estimatedReceive: size.times(mark).toNumber() };
}
