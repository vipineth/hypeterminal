import type {
	ActiveAssetDataResponse,
	AllDexsClearinghouseStateWsEvent,
	SpotClearinghouseStateResponse,
} from "@nktkas/hyperliquid";
import type Big from "big.js";
import { DEFAULT_QUOTE_TOKEN } from "@/config/app";
import type { Dex, Market, QuoteToken } from "@/domain/market/model";
import { toSafeBig } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export type ClearinghouseState = AllDexsClearinghouseStateWsEvent["clearinghouseStates"][number][1];
export type PerpPosition = ClearinghouseState["assetPositions"][number];
export type SpotState = SpotClearinghouseStateResponse;
export type SpotBalance = SpotState["balances"][number];

export type AccountMode =
	| { kind: "standard"; raw: "default" | "disabled" }
	| { kind: "unified" }
	| { kind: "portfolio" }
	| { kind: "legacyDexAbstraction" }
	| { kind: "unknown"; raw: string };

type PerDexMode = Extract<AccountMode, { kind: "standard" | "legacyDexAbstraction" }>;
type SharedMode = Extract<AccountMode, { kind: "unified" | "portfolio" | "unknown" }>;

export type AccountState =
	| { status: "loading" }
	| { status: "error" }
	| {
			status: "ready";
			ledger: "perDex";
			user: string;
			mode: PerDexMode;
			spotCurrent: boolean;
			perpCurrent: boolean;
			spot: SpotState;
			dexes: ReadonlyMap<string, ClearinghouseState>;
	  }
	| {
			status: "ready";
			ledger: "spotOnly";
			user: string;
			mode: SharedMode;
			spotCurrent: boolean;
			perpCurrent: boolean;
			spot: SpotState;
			positions: ReadonlyMap<string, readonly PerpPosition[]>;
	  };

export type ReadyAccount = Extract<AccountState, { status: "ready" }>;

export type CollateralSource =
	| { kind: "dex"; dex: Dex }
	| { kind: "mainVia"; dex: Dex }
	| { kind: "spot"; token: QuoteToken }
	| { kind: "exchangeOnly"; token: QuoteToken };

export type FundsPlace = { kind: "perp" } | { kind: "spot" };

export type Shortfall =
	| { kind: "dexEmpty"; dex: Dex; token: QuoteToken; elsewhere: readonly { place: FundsPlace; amount: string }[] }
	| { kind: "inUse"; token: QuoteToken }
	| { kind: "noFunds"; token: QuoteToken };

export interface AppliedLeverage {
	user: string;
	coin: string;
	leverage: ActiveAssetDataResponse["leverage"];
}

export type QuoteCheck =
	| {
			status: "live";
			quote: ActiveAssetDataResponse;
			applied: AppliedLeverage | null;
	  }
	| { status: "waiting" };

export type Collateral =
	| { status: "pending"; reason: "account" | "quote" }
	| {
			status: "ready";
			source: CollateralSource;
			token: QuoteToken;
			available: string;
			maxSize: string | null;
			shortfall: Shortfall | null;
	  };

export type TransferLimit =
	| { status: "pending" }
	| { status: "unverifiedTransferLimit" }
	| { status: "ready"; amount: string };

export type TransferRoute = "perpToSpot" | "spotToPerp" | "withdraw";

const MAIN_DEX = "";

export function parseAccountMode(abstraction: string | null | undefined, dexAbstractionEnabled?: boolean): AccountMode {
	switch (abstraction) {
		case "unifiedAccount":
			return { kind: "unified" };
		case "portfolioMargin":
			return { kind: "portfolio" };
		case "dexAbstraction":
			return { kind: "legacyDexAbstraction" };
		case undefined:
		case null:
		case "default":
		case "disabled":
			if (dexAbstractionEnabled === true) return { kind: "legacyDexAbstraction" };
			return { kind: "standard", raw: abstraction === "disabled" ? "disabled" : "default" };
		default:
			return { kind: "unknown", raw: abstraction };
	}
}

interface AccountStreams {
	user: string;
	mode: AccountMode;
	spotCurrent: boolean;
	perpCurrent: boolean;
	clearinghouseStates: AllDexsClearinghouseStateWsEvent["clearinghouseStates"];
	spot: SpotState;
}

export function buildAccountState({
	user,
	mode,
	spotCurrent,
	perpCurrent,
	clearinghouseStates,
	spot,
}: AccountStreams): ReadyAccount {
	switch (mode.kind) {
		case "standard":
		case "legacyDexAbstraction":
			return {
				status: "ready",
				ledger: "perDex",
				user,
				mode,
				spotCurrent,
				perpCurrent,
				spot,
				dexes: new Map(clearinghouseStates),
			};
		case "unified":
		case "portfolio":
		case "unknown":
			return {
				status: "ready",
				ledger: "spotOnly",
				user,
				mode,
				spotCurrent,
				perpCurrent,
				spot,
				positions: new Map(clearinghouseStates.map(([dex, state]) => [dex, state.assetPositions])),
			};
		default:
			return mode satisfies never;
	}
}

function positiveOrZero(amount: Big): string {
	return amount.gt(0) ? amount.toFixed() : "0";
}

export function getSpotAvailable(account: ReadyAccount, tokenName: string): string | null {
	const balance = account.spot.balances.find((entry) => entry.coin === tokenName);
	if (!balance) return "0";
	const unheld = toSafeBig(balance.total).minus(balance.hold);
	if (account.ledger === "perDex") return positiveOrZero(unheld);
	const afterMaintenance = account.spot.tokenToAvailableAfterMaintenance;
	if (!afterMaintenance) return null;
	const token = "token" in balance ? balance.token : null;
	const listed = afterMaintenance.find(([index]) => index === token)?.[1];
	return positiveOrZero(listed != null ? toSafeBig(listed) : unheld);
}

function getSpotTotal(spot: SpotState, tokenName: string): string {
	return spot.balances.find((entry) => entry.coin === tokenName)?.total ?? "0";
}

export function getCollateralSource(account: ReadyAccount, market: Market): CollateralSource {
	if (market.kind === "spot") return { kind: "spot", token: market.quote };
	const token = market.dex.collateralToken;
	switch (account.mode.kind) {
		case "standard":
			return { kind: "dex", dex: market.dex };
		case "legacyDexAbstraction":
			if (market.kind === "perp") return { kind: "dex", dex: market.dex };
			if (token.name === DEFAULT_QUOTE_TOKEN) return { kind: "mainVia", dex: market.dex };
			return { kind: "spot", token };
		case "unified":
			return { kind: "spot", token };
		case "portfolio":
		case "unknown":
			return { kind: "exchangeOnly", token };
		default:
			return account.mode satisfies never;
	}
}

function ledgerFor(account: ReadyAccount, source: CollateralSource): ClearinghouseState | undefined {
	if (account.ledger !== "perDex") return undefined;
	if (source.kind === "dex") return account.dexes.get(source.dex.name);
	if (source.kind === "mainVia") return account.dexes.get(MAIN_DEX);
	return undefined;
}

function getElsewhere(account: ReadyAccount, dex: Dex, token: QuoteToken) {
	const elsewhere: { place: FundsPlace; amount: string }[] = [];
	if (account.ledger === "perDex" && dex.name !== MAIN_DEX && token.name === DEFAULT_QUOTE_TOKEN) {
		const main = account.dexes.get(MAIN_DEX)?.withdrawable ?? "0";
		if (toSafeBig(main).gt(0)) elsewhere.push({ place: { kind: "perp" }, amount: main });
	}
	const spot = getSpotAvailable(account, token.name);
	if (spot !== null && toSafeBig(spot).gt(0)) elsewhere.push({ place: { kind: "spot" }, amount: spot });
	return elsewhere;
}

function getShortfall(account: ReadyAccount, source: CollateralSource, token: QuoteToken): Shortfall {
	const ledger = ledgerFor(account, source);
	if (source.kind === "dex" && !toSafeBig(ledger?.marginSummary.accountValue).gt(0)) {
		const elsewhere = getElsewhere(account, source.dex, token);
		if (elsewhere.length > 0) return { kind: "dexEmpty", dex: source.dex, token, elsewhere };
		return { kind: "noFunds", token };
	}
	if (ledger) {
		return toSafeBig(ledger.marginSummary.accountValue).gt(0) ? { kind: "inUse", token } : { kind: "noFunds", token };
	}
	return toSafeBig(getSpotTotal(account.spot, token.name)).gt(0)
		? { kind: "inUse", token }
		: { kind: "noFunds", token };
}

function sameUser(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

function sameLeverage(a: ActiveAssetDataResponse["leverage"], b: ActiveAssetDataResponse["leverage"]): boolean {
	return a.type === b.type && a.value === b.value;
}

function isQuoteFor(
	check: QuoteCheck,
	account: ReadyAccount,
	market: Market,
): check is Extract<QuoteCheck, { status: "live" }> {
	if (check.status !== "live") return false;
	const { quote, applied } = check;
	if (!sameUser(quote.user, account.user)) return false;
	if (quote.coin !== market.name) return false;
	if (!applied || !sameUser(applied.user, account.user) || applied.coin !== market.name) return true;
	return sameLeverage(quote.leverage, applied.leverage);
}

export function getTradeCollateral(account: AccountState, market: Market, side: Side, quote: QuoteCheck): Collateral {
	if (account.status !== "ready") return { status: "pending", reason: "account" };
	const source = getCollateralSource(account, market);

	if (market.kind === "spot") {
		const token = side === "buy" ? market.quote : market.base;
		const limit = getSpotLimit(account, token.name);
		if (limit.status !== "ready") return { status: "pending", reason: "account" };
		const available = limit.amount;
		const shortfall = toSafeBig(available).gt(0) ? null : getShortfall(account, { kind: "spot", token }, token);
		return { status: "ready", source: { kind: "spot", token }, token, available, maxSize: null, shortfall };
	}

	if (!isQuoteFor(quote, account, market)) return { status: "pending", reason: "quote" };
	const sideIndex = side === "buy" ? 0 : 1;
	const available = quote.quote.availableToTrade[sideIndex];
	const maxSize = quote.quote.maxTradeSzs[sideIndex];
	const token = market.dex.collateralToken;
	const shortfall = toSafeBig(available).gt(0) ? null : getShortfall(account, source, token);
	return { status: "ready", source, token, available, maxSize, shortfall };
}

export function getSpotLimit(account: ReadyAccount, tokenName: string): TransferLimit {
	if (!account.spotCurrent) return { status: "pending" };
	const amount = getSpotAvailable(account, tokenName);
	return amount === null ? { status: "pending" } : { status: "ready", amount };
}

export function getTransferLimit(account: AccountState, route: TransferRoute): TransferLimit {
	if (account.status !== "ready") return { status: "pending" };
	if (account.ledger === "spotOnly") {
		if (route === "withdraw") return getSpotLimit(account, DEFAULT_QUOTE_TOKEN);
		if (!account.spotCurrent || !account.perpCurrent) return { status: "pending" };
		return { status: "unverifiedTransferLimit" };
	}
	if (route === "spotToPerp") return getSpotLimit(account, DEFAULT_QUOTE_TOKEN);
	if (!account.perpCurrent) return { status: "pending" };
	return { status: "ready", amount: account.dexes.get(MAIN_DEX)?.withdrawable ?? "0" };
}
