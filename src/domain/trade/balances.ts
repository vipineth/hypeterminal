import Big from "big.js";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import type { SpotBalance } from "@/hooks/trade/use-account-balances";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toBig, toSafeBig } from "@/lib/trade/numbers";
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

export interface SpotBalanceData {
	baseAvailable: number;
	quoteAvailable: number;
	baseName: string;
	quoteName: string;
}

export interface BalanceRow {
	asset: string;
	type: "perp" | "spot";
	available: string;
	inOrder: string;
	total: string;
	usdValue: string;
	entryNtl: string;
}

export function getSpotBalance(balances: SpotBalance[] | null | undefined, coin: string): SpotBalance | null {
	if (!balances?.length) return null;
	return balances.find((balance) => balance.coin === coin) ?? null;
}

export function getPerpAvailable(
	accountValue: string | number | null | undefined,
	marginUsed: string | number | null | undefined,
): number {
	const av = toSafeBig(accountValue);
	const mu = toSafeBig(marginUsed);
	return Math.max(0, av.minus(mu).toNumber());
}

export function getAvailableFromTotals(
	total: string | number | null | undefined,
	hold: string | number | null | undefined,
): number {
	const t = toSafeBig(total);
	const h = toSafeBig(hold);
	return Math.max(0, t.minus(h).toNumber());
}

export function getSpotBalanceData(
	spotBalances: SpotBalance[] | null | undefined,
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

interface PerpSummary {
	accountValue?: string | number | null;
	totalMarginUsed?: string | number | null;
}

export function getBalanceRows(
	perpSummary: PerpSummary | null | undefined,
	spotBalances: SpotBalance[] | null | undefined,
): BalanceRow[] {
	const rows: BalanceRow[] = [];

	const perpAccountValue = toBig(perpSummary?.accountValue);
	if (perpAccountValue?.gt(0)) {
		rows.push({
			asset: DEFAULT_QUOTE_TOKEN,
			type: "perp",
			available: String(getPerpAvailable(perpSummary?.accountValue, perpSummary?.totalMarginUsed)),
			inOrder: perpSummary?.totalMarginUsed?.toString() ?? "0",
			total: perpSummary?.accountValue?.toString() ?? "0",
			usdValue: perpSummary?.accountValue?.toString() ?? "0",
			entryNtl: perpSummary?.accountValue?.toString() ?? "0",
		});
	}

	for (const balance of spotBalances ?? []) {
		const total = toBig(balance.total);
		if (!total || total.eq(0)) continue;

		const available = getAvailableFromTotals(balance.total, balance.hold);
		const entryNtl = balance.entryNtl ?? "0";
		const usdValue = balance.coin === DEFAULT_QUOTE_TOKEN ? balance.total : entryNtl;

		rows.push({
			asset: balance.coin,
			type: "spot",
			available: String(available),
			inOrder: balance.hold ?? "0",
			total: balance.total ?? "0",
			usdValue,
			entryNtl,
		});
	}

	rows.sort((a, b) => toSafeBig(b.usdValue).cmp(toSafeBig(a.usdValue)));
	return rows;
}

export function getTotalUsdValue(rows: BalanceRow[]): number {
	return rows.reduce((sum, row) => Big(sum).plus(toSafeBig(row.usdValue)).toNumber(), 0);
}

export function filterBalanceRowsByUsdValue(rows: BalanceRow[], minUsd: number): BalanceRow[] {
	return rows.filter((row) => toSafeBig(row.usdValue).gte(minUsd));
}
