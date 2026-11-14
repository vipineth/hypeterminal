import Big from "big.js";
import type { Dex, ListedMarket, QuoteToken } from "@/domain/market/model";
import {
	type AccountState,
	type ClearinghouseState,
	getSpotLimit,
	type Shortfall,
	type TransferLimit,
} from "@/domain/trade/account-mode";
import { toSafeBig } from "@/lib/trade/numbers";
import { formatTokenId } from "@/lib/trade/token-id";
import type { Side } from "@/lib/trade/types";

export type Venue = { kind: "spot" } | { kind: "perp"; dex: string };

export interface TransferRoute {
	from: Venue;
	to: Venue;
}

export interface SendAssetParams {
	destination: `0x${string}`;
	sourceDex: string;
	destinationDex: string;
	token: string;
	amount: string;
}

const MAIN_DEX = "";
const SPOT_DEX = "spot";
const MIN_LEFT_IN_DEX_OF_NOTIONAL = 0.1;

export const SPOT: Venue = { kind: "spot" };
export const MAIN_PERP: Venue = { kind: "perp", dex: MAIN_DEX };

export function dexVenue(dex: string): Venue {
	return { kind: "perp", dex };
}

export function toWireDex(venue: Venue): string {
	return venue.kind === "spot" ? SPOT_DEX : venue.dex;
}

export function isBuilderVenue(venue: Venue): venue is { kind: "perp"; dex: string } {
	return venue.kind === "perp" && venue.dex !== MAIN_DEX;
}

export function sameVenue(a: Venue, b: Venue): boolean {
	return toWireDex(a) === toWireDex(b);
}

function venueToken(venue: Venue, dexes: readonly Dex[], usdc: QuoteToken): QuoteToken | null | "any" {
	if (venue.kind === "spot") return "any";
	if (venue.dex === MAIN_DEX) return usdc;
	return dexes.find((dex) => dex.name === venue.dex)?.collateralToken ?? null;
}

export function getRouteToken(route: TransferRoute, dexes: readonly Dex[], usdc: QuoteToken): QuoteToken | null {
	if (sameVenue(route.from, route.to)) return null;
	const from = venueToken(route.from, dexes, usdc);
	const to = venueToken(route.to, dexes, usdc);
	if (from === null || to === null) return null;
	if (from === "any") return to === "any" ? null : to;
	if (to === "any") return from;
	return from.name === to.name ? from : null;
}

export function getDexWithdrawCap(state: ClearinghouseState): string {
	const { accountValue, totalMarginUsed, totalNtlPos } = state.marginSummary;
	const initialMargin = toSafeBig(totalMarginUsed);
	const notionalFloor = toSafeBig(totalNtlPos).times(MIN_LEFT_IN_DEX_OF_NOTIONAL);
	const leftBehind = initialMargin.gt(notionalFloor) ? initialMargin : notionalFloor;
	const byFloor = toSafeBig(accountValue).minus(leftBehind);
	const withdrawable = toSafeBig(state.withdrawable);
	const cap = byFloor.lt(withdrawable) ? byFloor : withdrawable;
	return cap.gt(0) ? cap.toFixed() : "0";
}

export function getVenueLimit(account: AccountState, venue: Venue, token: QuoteToken): TransferLimit {
	if (account.status !== "ready") return { status: "pending" };
	if (account.ledger === "spotOnly") return { status: "unverifiedTransferLimit" };
	if (venue.kind === "spot") return getSpotLimit(account, token.name);
	if (!account.perpCurrent) return { status: "pending" };
	const state = account.dexes.get(venue.dex);
	if (!state) return { status: "ready", amount: "0" };
	return { status: "ready", amount: venue.dex === MAIN_DEX ? state.withdrawable : getDexWithdrawCap(state) };
}

export function buildSendAsset(
	user: `0x${string}`,
	route: TransferRoute,
	token: QuoteToken,
	amount: string,
): SendAssetParams | null {
	if (token.tokenId === null) return null;
	return {
		destination: user,
		sourceDex: toWireDex(route.from),
		destinationDex: toWireDex(route.to),
		token: formatTokenId({ name: token.name, tokenId: token.tokenId }),
		amount,
	};
}

export interface FundDexPlan {
	route: TransferRoute;
	amount: string;
}

export function getFundDexPlan(
	shortfall: Extract<Shortfall, { kind: "dexEmpty" }>,
	need: number,
	decimals: number,
): FundDexPlan {
	const richest = [...shortfall.elsewhere].sort((a, b) => toSafeBig(b.amount).cmp(toSafeBig(a.amount)))[0];
	const from = richest?.place.kind === "perp" ? MAIN_PERP : SPOT;
	const route = { from, to: dexVenue(shortfall.dex.name) };
	if (!(need > 0)) return { route, amount: "" };
	const rounded = Big(need).round(decimals, Big.roundUp);
	const have = toSafeBig(richest?.amount);
	return { route, amount: (rounded.gt(have) ? have : rounded).toFixed() };
}

export function getTransferVenues(
	account: AccountState,
	dexes: readonly Dex[],
	tradableDexes: ReadonlySet<string>,
	route: TransferRoute,
): Venue[] {
	const pinned = new Set([toWireDex(route.from), toWireDex(route.to)]);
	const funded = new Set<string>();
	if (account.status === "ready" && account.ledger === "perDex") {
		for (const [name, state] of account.dexes) {
			if (toSafeBig(state.marginSummary.accountValue).gt(0)) funded.add(name);
		}
	}
	const builders = dexes
		.filter(
			(dex) => dex.name !== MAIN_DEX && (pinned.has(dex.name) || funded.has(dex.name) || tradableDexes.has(dex.name)),
		)
		.sort((a, b) => Number(funded.has(b.name)) - Number(funded.has(a.name)) || a.index - b.index);
	return [MAIN_PERP, SPOT, ...builders.map((dex) => dexVenue(dex.name))];
}

export function getTradableDexes(listed: readonly ListedMarket[]): Set<string> {
	const names = new Set<string>();
	for (const market of listed) if (market.kind === "builderPerp") names.add(market.dex.name);
	return names;
}

export interface FundingLeg {
	side: Side;
	size: string;
	price: string;
}

export interface FundingOrder {
	legs: readonly FundingLeg[];
	markPx: string;
	leverage: number;
	feeRate: number;
}

function getLegNeed({ side, size, price }: FundingLeg, mark: Big, leverage: number, feeRate: number): Big {
	const sz = toSafeBig(size);
	const px = toSafeBig(price);
	const marginPrice = px.gt(mark) ? px : mark;
	const adverse = side === "buy" ? px.minus(mark) : mark.minus(px);
	const immediateLoss = adverse.gt(0) ? sz.times(adverse) : Big(0);
	return sz.times(marginPrice).div(leverage).plus(immediateLoss).plus(sz.times(px).times(feeRate));
}

export function getFundingNeed({ legs, markPx, leverage, feeRate }: FundingOrder): number {
	const mark = toSafeBig(markPx);
	if (!(leverage > 0) || !mark.gt(0)) return 0;
	return legs.reduce((need, leg) => need.plus(getLegNeed(leg, mark, leverage, feeRate)), Big(0)).toNumber();
}
