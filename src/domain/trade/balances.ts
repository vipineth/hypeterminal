import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { parseNumberOrZero } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export function getMarketQuoteToken(market: UnifiedMarketInfo | undefined): string {
	if (!market) return DEFAULT_QUOTE_TOKEN;

	if (market.kind === "spot") {
		return market.tokensInfo?.[1]?.name ?? DEFAULT_QUOTE_TOKEN;
	}

	if (market.kind === "builderPerp") {
		return market.quoteToken?.name ?? DEFAULT_QUOTE_TOKEN;
	}

	return DEFAULT_QUOTE_TOKEN;
}

export interface SpotBalanceLike {
	coin: string;
	total?: string;
	hold?: string;
	entryNtl?: string;
}

export interface PerpSummaryLike {
	accountValue?: string | number | null;
	totalMarginUsed?: string | number | null;
}

export interface SpotBalanceData {
	baseAvailable: number;
	quoteAvailable: number;
	/** Token name (API identifier) - use for balance lookups, e.g., "USDT0", "UBTC" */
	baseName: string;
	/** Token name (API identifier) - use for balance lookups */
	quoteName: string;
}

export interface BalanceRow {
	asset: string;
	type: "perp" | "spot";
	available: string;
	inOrder: string;
	total: string;
	usdValue: string;
}

export function getSpotBalance(balances: SpotBalanceLike[] | null | undefined, coin: string): SpotBalanceLike | null {
	if (!balances?.length) return null;
	return balances.find((balance) => balance.coin === coin) ?? null;
}

export function getPerpAvailable(
	accountValue: string | number | null | undefined,
	marginUsed: string | number | null | undefined,
): number {
	const account = parseNumberOrZero(accountValue);
	const margin = parseNumberOrZero(marginUsed);
	return Math.max(0, account - margin);
}

export function getAvailableFromTotals(
	total: string | number | null | undefined,
	hold: string | number | null | undefined,
): number {
	const totalValue = parseNumberOrZero(total);
	const holdValue = parseNumberOrZero(hold);
	return Math.max(0, totalValue - holdValue);
}

export function getSpotBalanceData(
	spotBalances: SpotBalanceLike[] | null | undefined,
	market: UnifiedMarketInfo | undefined,
): SpotBalanceData {
	const quoteName = getMarketQuoteToken(market);

	if (!market) {
		return { baseAvailable: 0, quoteAvailable: 0, baseName: "", quoteName };
	}

	if (market.kind === "spot") {
		const baseName = market.tokensInfo?.[0]?.name ?? "";
		const baseBalance = getSpotBalance(spotBalances, baseName);
		const quoteBalance = getSpotBalance(spotBalances, quoteName);

		return {
			baseAvailable: getAvailableFromTotals(baseBalance?.total, baseBalance?.hold),
			quoteAvailable: getAvailableFromTotals(quoteBalance?.total, quoteBalance?.hold),
			baseName,
			quoteName,
		};
	}

	if (market.kind === "builderPerp") {
		const quoteBalance = getSpotBalance(spotBalances, quoteName);
		return {
			baseAvailable: 0,
			quoteAvailable: getAvailableFromTotals(quoteBalance?.total, quoteBalance?.hold),
			baseName: "",
			quoteName,
		};
	}

	return { baseAvailable: 0, quoteAvailable: 0, baseName: "", quoteName };
}

export function getAvailableBalance(
	market: UnifiedMarketInfo | undefined,
	side: Side,
	spotBalance: SpotBalanceData,
	perpAvailable: number,
): number {
	if (market?.kind === "spot") {
		return side === "buy" ? spotBalance.quoteAvailable : spotBalance.baseAvailable;
	}

	if (market?.kind === "builderPerp") {
		return spotBalance.quoteAvailable;
	}

	return perpAvailable;
}

export function getAvailableBalanceToken(market: UnifiedMarketInfo | undefined, side: Side): string {
	if (market?.kind === "spot") {
		const token = side === "sell" ? market.tokensInfo?.[0] : market.tokensInfo?.[1];
		return token?.displayName ?? token?.name ?? "";
	}
	if (market?.kind === "builderPerp") {
		return market.quoteToken?.displayName ?? market.quoteToken?.name ?? DEFAULT_QUOTE_TOKEN;
	}
	return DEFAULT_QUOTE_TOKEN;
}

export function getBalanceRows(
	perpSummary: PerpSummaryLike | null | undefined,
	spotBalances: SpotBalanceLike[] | null | undefined,
): BalanceRow[] {
	const rows: BalanceRow[] = [];
	const balances = spotBalances ?? [];

	const perpAccountValue = parseNumberOrZero(perpSummary?.accountValue);
	const perpAvailable = getPerpAvailable(perpSummary?.accountValue, perpSummary?.totalMarginUsed);

	if (perpAccountValue > 0) {
		rows.push({
			asset: DEFAULT_QUOTE_TOKEN,
			type: "perp",
			available: String(perpAvailable),
			inOrder: perpSummary?.totalMarginUsed?.toString() ?? "0",
			total: perpSummary?.accountValue?.toString() ?? "0",
			usdValue: perpSummary?.accountValue?.toString() ?? "0",
		});
	}

	for (const balance of balances) {
		const totalValue = balance.total ?? "0";
		const holdValue = balance.hold ?? "0";
		const entryValue = balance.entryNtl ?? "0";
		const total = parseNumberOrZero(totalValue);
		if (total === 0) continue;
		const available = getAvailableFromTotals(totalValue, holdValue);
		const usdValue = balance.coin === DEFAULT_QUOTE_TOKEN ? totalValue : entryValue;

		rows.push({
			asset: balance.coin,
			type: "spot",
			available: String(available),
			inOrder: holdValue,
			total: totalValue,
			usdValue,
		});
	}

	rows.sort((a, b) => parseNumberOrZero(b.usdValue) - parseNumberOrZero(a.usdValue));
	return rows;
}

export function getTotalUsdValue(rows: BalanceRow[]): number {
	return rows.reduce((sum, row) => sum + parseNumberOrZero(row.usdValue), 0);
}

export function filterBalanceRowsByUsdValue(rows: BalanceRow[], minUsd: number): BalanceRow[] {
	return rows.filter((row) => parseNumberOrZero(row.usdValue) >= minUsd);
}
