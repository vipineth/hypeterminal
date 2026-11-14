import Big from "big.js";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { SMALL_BALANCE_THRESHOLD_USD } from "@/config/trade";
import { isAmountWithinBalance } from "@/domain/market/calculations";
import type {
	AccountAbstraction,
	SpotAvailableAfterMaintenance,
	SpotBalance,
} from "@/hooks/trade/use-account-balances";
import type { Dex } from "@/domain/market/model";
import {
	type AccountState,
	getSpotAvailable as getSpotTokenAvailable,
	getTransferLimit,
	type ReadyAccount,
	type SpotState,
	type TransferLimit,
} from "@/domain/trade/account-mode";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toSafeBig } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export type { AccountAbstraction, SpotAvailableAfterMaintenance };

export function getMarketQuoteToken(market: UnifiedMarketInfo | undefined): string {
	return market?.quote.name ?? DEFAULT_QUOTE_TOKEN;
}

export interface SpotBalanceData {
	baseAvailable: number;
	quoteAvailable: number;
	baseName: string;
	quoteName: string;
}

export function getSpotBalance(balances: SpotBalance[] | null | undefined, coin: string): SpotBalance | null {
	if (!balances?.length) return null;
	return balances.find((balance) => balance.coin === coin) ?? null;
}

export function isQuoteBalanceSharedWithPerps(accountAbstraction: AccountAbstraction | null | undefined): boolean {
	const mode: string | null | undefined = accountAbstraction;
	return mode === "unifiedAccount" || mode === "portfolioMargin" || mode === "dexAbstraction";
}

function getAvailableAfterMaintenanceValue(
	token: number | string | null | undefined,
	spotAvailableAfterMaintenance: SpotAvailableAfterMaintenance | null | undefined,
): string | null {
	if (token == null) return null;
	const tokenKey = String(token);
	const match = spotAvailableAfterMaintenance?.find(([availableToken]) => String(availableToken) === tokenKey);
	return match?.[1] ?? null;
}

export function getSpotAvailableValue(
	balance: SpotBalance | null | undefined,
	spotAvailableAfterMaintenance?: SpotAvailableAfterMaintenance | null,
): string {
	const token = balance && "token" in balance ? balance.token : undefined;
	const availableAfterMaintenance = getAvailableAfterMaintenanceValue(token, spotAvailableAfterMaintenance);
	if (availableAfterMaintenance != null) {
		const available = toSafeBig(availableAfterMaintenance);
		return available.gt(0) ? available.toString() : "0";
	}

	const available = toSafeBig(balance?.total).minus(toSafeBig(balance?.hold));
	return available.gt(0) ? available.toString() : "0";
}

export function getSpotAvailable(
	balance: SpotBalance | null | undefined,
	spotAvailableAfterMaintenance?: SpotAvailableAfterMaintenance | null,
): number {
	return toSafeBig(getSpotAvailableValue(balance, spotAvailableAfterMaintenance)).toNumber();
}

export function getSpotBalanceData(
	spotBalances: SpotBalance[] | null | undefined,
	market: UnifiedMarketInfo | undefined,
	spotAvailableAfterMaintenance?: SpotAvailableAfterMaintenance | null,
): SpotBalanceData {
	const quoteName = getMarketQuoteToken(market);

	if (!market) {
		return { baseAvailable: 0, quoteAvailable: 0, baseName: "", quoteName };
	}

	if (market.kind === "spot") {
		const baseName = market.base.name;
		const baseBalance = getSpotBalance(spotBalances, baseName);
		const quoteBalance = getSpotBalance(spotBalances, quoteName);

		return {
			baseAvailable: getSpotAvailable(baseBalance, spotAvailableAfterMaintenance),
			quoteAvailable: getSpotAvailable(quoteBalance, spotAvailableAfterMaintenance),
			baseName,
			quoteName,
		};
	}

	return { baseAvailable: 0, quoteAvailable: 0, baseName: "", quoteName };
}

export function getAvailableBalanceToken(market: UnifiedMarketInfo | undefined, side: Side): string {
	if (market?.kind === "spot") {
		const token = side === "sell" ? market.base : market.quote;
		return token.displayName;
	}
	if (market?.kind === "builderPerp") {
		return market.quote.displayName;
	}
	return DEFAULT_QUOTE_TOKEN;
}

export function getNormalizedWithdrawable(
	withdrawable: string,
	spotBalances: SpotBalance[] | null | undefined,
	spotAvailableAfterMaintenance: SpotAvailableAfterMaintenance | null | undefined,
	accountAbstraction: AccountAbstraction | null | undefined,
): string {
	if (isQuoteBalanceSharedWithPerps(accountAbstraction)) {
		const quoteBalance = getSpotBalance(spotBalances, DEFAULT_QUOTE_TOKEN);
		return getSpotAvailableValue(quoteBalance, spotAvailableAfterMaintenance);
	}
	return withdrawable;
}

export type SpendPlace = "perp" | "spot";

export function getSpendLimit(account: AccountState, place: SpendPlace, token: string): TransferLimit {
	if (place === "perp") return getTransferLimit(account, "perpToSpot");
	if (account.status !== "ready") return { status: "pending" };
	return { status: "ready", amount: getSpotTokenAvailable(account.spot, token) };
}

export function getSpendableSpotTokens(spot: SpotState): string[] {
	return spot.balances
		.filter((balance) => toSafeBig(getSpotTokenAvailable(spot, balance.coin)).gt(0))
		.map((balance) => balance.coin);
}

export function isWithinSpendLimit(amount: string, limit: TransferLimit): boolean {
	switch (limit.status) {
		case "ready":
			return isAmountWithinBalance(amount, limit.amount);
		case "unverifiedTransferLimit":
			return toSafeBig(amount).gt(0);
		case "pending":
			return false;
		default:
			return limit satisfies never;
	}
}

const MAIN_DEX = "";

export type TransferDirection = "toSpot" | "toPerp";

export interface BalanceRow {
	key: string;
	type: "perp" | "spot";
	asset: string;
	dexLabel: string | null;
	available: string;
	inOrder: string;
	total: string;
	usdValue: string;
	entryNtl: string;
	transfer: TransferDirection | null;
	canSend: boolean;
}

export type Balances =
	| { status: "loading" }
	| { status: "error" }
	| { status: "ready"; perp: BalanceRow[]; spot: BalanceRow[]; totalUsd: string; isEmpty: boolean };

function getPerpRows(account: ReadyAccount, dexes: readonly Dex[]): BalanceRow[] {
	switch (account.ledger) {
		case "spotOnly":
			return [];
		case "perDex": {
			const rows: BalanceRow[] = [];
			for (const [name, state] of account.dexes) {
				const accountValue = state.marginSummary.accountValue;
				const dex = dexes.find((entry) => entry.name === name);
				if (!dex || !toSafeBig(accountValue).gt(0)) continue;
				const isMain = name === MAIN_DEX;
				rows.push({
					key: `perp:${name}`,
					type: "perp",
					asset: dex.collateralToken.name,
					dexLabel: isMain ? null : name,
					available: state.withdrawable,
					inOrder: state.marginSummary.totalMarginUsed,
					total: accountValue,
					usdValue: accountValue,
					entryNtl: accountValue,
					transfer: isMain ? "toSpot" : null,
					canSend: isMain,
				});
			}
			return rows;
		}
		default:
			return account satisfies never;
	}
}

function getSpotRows(account: ReadyAccount): BalanceRow[] {
	const rows: BalanceRow[] = [];
	for (const balance of account.spot.balances) {
		if (toSafeBig(balance.total).eq(0)) continue;
		const isQuote = balance.coin === DEFAULT_QUOTE_TOKEN;
		rows.push({
			key: `spot:${balance.coin}`,
			type: "spot",
			asset: balance.coin,
			dexLabel: null,
			available: getSpotTokenAvailable(account.spot, balance.coin),
			inOrder: balance.hold,
			total: balance.total,
			usdValue: isQuote ? balance.total : balance.entryNtl,
			entryNtl: balance.entryNtl,
			transfer: isQuote && account.ledger === "perDex" ? "toPerp" : null,
			canSend: true,
		});
	}
	return rows.sort((a, b) => toSafeBig(b.usdValue).cmp(toSafeBig(a.usdValue)));
}

function isVisible(row: BalanceRow, hideSmall: boolean): boolean {
	return !hideSmall || toSafeBig(row.usdValue).gte(SMALL_BALANCE_THRESHOLD_USD);
}

export function getBalances(account: AccountState, dexes: readonly Dex[], hideSmall: boolean): Balances {
	if (account.status !== "ready") return account;
	const perp = getPerpRows(account, dexes);
	const spot = getSpotRows(account);
	const totalUsd = [...perp, ...spot].reduce((sum, row) => sum.plus(toSafeBig(row.usdValue)), Big(0)).toFixed();
	return {
		status: "ready",
		perp: perp.filter((row) => isVisible(row, hideSmall)),
		spot: spot.filter((row) => isVisible(row, hideSmall)),
		totalUsd,
		isEmpty: perp.length + spot.length === 0,
	};
}
