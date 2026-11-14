import Big from "big.js";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import { SMALL_BALANCE_THRESHOLD_USD } from "@/config/trade";
import { isAmountWithinBalance } from "@/domain/market/calculations";
import type { Dex, Market, QuoteToken } from "@/domain/market/model";
import {
	type AccountMode,
	type AccountState,
	type ClearinghouseState,
	getCollateralSource,
	getSpotAvailable,
	getTransferLimit,
	type ReadyAccount,
	type SpotState,
	type TransferLimit,
} from "@/domain/trade/account-mode";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toSafeBig } from "@/lib/trade/numbers";

export function getMarketQuoteToken(market: UnifiedMarketInfo | undefined): string {
	return market?.quote.name ?? DEFAULT_QUOTE_TOKEN;
}

export interface SpotBalanceData {
	baseAvailable: number;
	quoteAvailable: number;
	baseName: string;
	quoteName: string;
}

export type SpendPlace = "perp" | "spot";

export function getSpendLimit(account: AccountState, place: SpendPlace, token: string): TransferLimit {
	if (place === "perp") return getTransferLimit(account, "perpToSpot");
	if (account.status !== "ready") return { status: "pending" };
	return { status: "ready", amount: getSpotAvailable(account.spot, token) };
}

export function getSpendableSpotTokens(spot: SpotState): string[] {
	return spot.balances
		.filter((balance) => toSafeBig(getSpotAvailable(spot, balance.coin)).gt(0))
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
			available: getSpotAvailable(account.spot, balance.coin),
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

export type OverviewPlace =
	| { kind: "perps" }
	| { kind: "dex"; name: string }
	| { kind: "spot" }
	| { kind: "unified" }
	| { kind: "portfolio" }
	| { kind: "unknown" };

export type AccountNotice = "shared" | "unknown" | "legacy";

export interface LedgerMetrics {
	equity: string;
	accountValue: string;
	balance: string;
	unrealizedPnl: string;
	marginRatio: string;
	crossLeverage: string;
	maintenanceMargin: string;
	marginUsed: string;
	rawUsd: string;
	available: string;
}

export type PerpsOverview =
	| { kind: "ledger"; place: OverviewPlace; token: QuoteToken; notice: AccountNotice | null; metrics: LedgerMetrics }
	| {
			kind: "spot";
			place: OverviewPlace;
			token: QuoteToken;
			notice: AccountNotice | null;
			total: string;
			available: string;
	  };

export type AccountSummary =
	| { status: "pending" }
	| { status: "ready"; spotEquity: string; perpsEquity: string | null; perps: PerpsOverview };

type SharedMode = Extract<ReadyAccount, { ledger: "spotOnly" }>["mode"];

const MAIN_TOKEN: QuoteToken = { name: DEFAULT_QUOTE_TOKEN, displayName: DEFAULT_QUOTE_TOKEN };

function getNotice(mode: AccountMode): AccountNotice | null {
	switch (mode.kind) {
		case "standard":
			return null;
		case "legacyDexAbstraction":
			return "legacy";
		case "unified":
		case "portfolio":
			return "shared";
		case "unknown":
			return "unknown";
		default:
			return mode satisfies never;
	}
}

function getSharedPlace(mode: SharedMode): OverviewPlace {
	switch (mode.kind) {
		case "unified":
			return { kind: "unified" };
		case "portfolio":
			return { kind: "portfolio" };
		case "unknown":
			return { kind: "unknown" };
		default:
			return mode satisfies never;
	}
}

function getLedgerMetrics(state: ClearinghouseState | undefined): LedgerMetrics {
	const accountValue = toSafeBig(state?.crossMarginSummary.accountValue);
	const maintenanceMargin = toSafeBig(state?.crossMaintenanceMarginUsed);
	const unrealizedPnl = (state?.assetPositions ?? []).reduce(
		(sum, entry) => sum.plus(toSafeBig(entry.position.unrealizedPnl)),
		Big(0),
	);
	const hasValue = accountValue.gt(0);
	return {
		equity: toSafeBig(state?.marginSummary.accountValue).toFixed(),
		accountValue: accountValue.toFixed(),
		balance: accountValue.minus(unrealizedPnl).toFixed(),
		unrealizedPnl: unrealizedPnl.toFixed(),
		marginRatio: hasValue ? maintenanceMargin.div(accountValue).toFixed() : "0",
		crossLeverage: hasValue ? toSafeBig(state?.crossMarginSummary.totalNtlPos).abs().div(accountValue).toFixed() : "0",
		maintenanceMargin: maintenanceMargin.toFixed(),
		marginUsed: toSafeBig(state?.marginSummary.totalMarginUsed).toFixed(),
		rawUsd: toSafeBig(state?.marginSummary.totalRawUsd).toFixed(),
		available: toSafeBig(state?.withdrawable).toFixed(),
	};
}

function getSpotOverview(
	account: ReadyAccount,
	place: OverviewPlace,
	token: QuoteToken,
	notice: AccountNotice | null,
): PerpsOverview {
	const total = account.spot.balances.find((balance) => balance.coin === token.name)?.total ?? "0";
	return { kind: "spot", place, token, notice, total, available: getSpotAvailable(account.spot, token.name) };
}

function getPerpsOverview(account: ReadyAccount, market: Market | undefined): PerpsOverview {
	const notice = getNotice(account.mode);
	const perpMarket = market?.kind === "spot" ? undefined : market;
	switch (account.ledger) {
		case "spotOnly":
			return getSpotOverview(
				account,
				getSharedPlace(account.mode),
				perpMarket?.dex.collateralToken ?? MAIN_TOKEN,
				notice,
			);
		case "perDex": {
			const main = account.dexes.get(MAIN_DEX);
			if (!perpMarket) {
				return { kind: "ledger", place: { kind: "perps" }, token: MAIN_TOKEN, notice, metrics: getLedgerMetrics(main) };
			}
			const source = getCollateralSource(account, perpMarket);
			const token = perpMarket.dex.collateralToken;
			switch (source.kind) {
				case "dex": {
					const name = source.dex.name;
					const place: OverviewPlace = name === MAIN_DEX ? { kind: "perps" } : { kind: "dex", name };
					return { kind: "ledger", place, token, notice, metrics: getLedgerMetrics(account.dexes.get(name)) };
				}
				case "mainVia":
					return { kind: "ledger", place: { kind: "perps" }, token, notice, metrics: getLedgerMetrics(main) };
				case "spot":
				case "exchangeOnly":
					return getSpotOverview(account, { kind: "spot" }, token, notice);
				default:
					return source satisfies never;
			}
		}
		default:
			return account satisfies never;
	}
}

function getPerpsEquity(account: ReadyAccount): string | null {
	switch (account.ledger) {
		case "spotOnly":
			return null;
		case "perDex":
			return [...account.dexes.values()]
				.reduce((sum, state) => sum.plus(toSafeBig(state.marginSummary.accountValue)), Big(0))
				.toFixed();
		default:
			return account satisfies never;
	}
}

export function getAccountSummary(account: AccountState, market: Market | undefined): AccountSummary {
	if (account.status !== "ready") return { status: "pending" };
	const spotEquity = getSpotRows(account)
		.reduce((sum, row) => sum.plus(toSafeBig(row.usdValue)), Big(0))
		.toFixed();
	return {
		status: "ready",
		spotEquity,
		perpsEquity: getPerpsEquity(account),
		perps: getPerpsOverview(account, market),
	};
}
