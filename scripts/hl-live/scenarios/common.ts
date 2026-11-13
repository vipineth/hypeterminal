import type { FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import { parseMarkets } from "@/domain/market/model";
import type { OrderPlan } from "@/domain/trade/order-intent";
import { toSafeBig } from "@/lib/trade/numbers";
import { type Venue, loadVenue, perpState, venueOrders } from "../account";
import { depthWithinSlippage, errorMessage, expectPosition, expectStatuses, type OrderStatus, positionSize } from "../assert";
import type { Harness } from "../harness";
import { intents, lotSize, plan, SLIPPAGE_BPS } from "../plans";

export type Scope = "perp" | "spot" | "account";

type FrontendOpenOrder = FrontendOpenOrdersResponse[number];

export interface ScenarioContext {
	h: Harness;
	venue: Venue;
}

export interface Scenario {
	name: string;
	scope: Scope;
	source: "app" | "sdk";
	run(ctx: ScenarioContext): Promise<void>;
}

export class Unsupported extends Error {}

const NO_MATCH = "could not immediately match";
const DEX_OI_CAP = "Perp DEX open interest is at cap";

export async function fresh(ctx: ScenarioContext): Promise<Venue> {
	return loadVenue(ctx.h.info, ctx.venue);
}

export async function send(ctx: ScenarioContext, built: OrderPlan): Promise<OrderStatus[]> {
	try {
		const response = await ctx.h.agent.order({ orders: built.orders, grouping: built.grouping });
		return response.response.data.statuses;
	} catch (error) {
		const [first] = built.orders;
		const message = errorMessage(error);
		if (message.includes(DEX_OI_CAP)) throw new Unsupported(message);
		if (message.includes(NO_MATCH) && first && (await liquidityWithinSlippage(ctx, first.b)).eq(0)) {
			throw new Unsupported(`no ${first.b ? "asks" : "bids"} within ${SLIPPAGE_BPS} bps of mark on ${ctx.venue.coin}`);
		}
		throw error;
	}
}

export function restingOid(status: OrderStatus): number {
	if (typeof status === "object" && "resting" in status) return status.resting.oid;
	throw new Error(`expected a resting order, got ${JSON.stringify(status)}`);
}

export async function liquidityWithinSlippage(ctx: ScenarioContext, isBuy: boolean) {
	const [venue, book] = await Promise.all([fresh(ctx), ctx.h.info.l2Book({ coin: ctx.venue.coin })]);
	return depthWithinSlippage(book, isBuy, venue.markPx, SLIPPAGE_BPS);
}

export async function openLong(ctx: ScenarioContext, size?: string): Promise<{ venue: Venue; size: string }> {
	const venue = await fresh(ctx);
	const lot = size ?? lotSize(venue);
	expectStatuses(await send(ctx, plan(intents.market(venue, "buy", lot))), ["filled"]);
	expectPosition(await perpState(ctx.h, venue), venue.coin, lot);
	return { venue, size: lot };
}

export async function currentPosition(ctx: ScenarioContext): Promise<string> {
	return positionSize(await perpState(ctx.h, ctx.venue), ctx.venue.coin);
}

export async function openOrder(ctx: ScenarioContext, oid: number) {
	const order = (await venueOrders(ctx.h, ctx.venue)).find((entry) => entry.oid === oid);
	if (!order) throw new Error(`order ${oid} is not open on ${ctx.venue.coin}`);
	return order;
}

export interface ExpectedOrder {
	side: "buy" | "sell";
	price: string;
	size: string;
	tif?: string;
}

export function expectOrder(open: FrontendOpenOrder, expected: ExpectedOrder): void {
	const actual = { side: open.side === "B" ? "buy" : "sell", price: open.limitPx, size: open.sz, tif: open.tif ?? "" };
	const same =
		actual.side === expected.side &&
		(expected.tif === undefined || actual.tif === expected.tif) &&
		toSafeBig(actual.price).eq(toSafeBig(expected.price)) &&
		toSafeBig(actual.size).eq(toSafeBig(expected.size));
	if (!same) throw new Error(`expected ${JSON.stringify(expected)}, the open order is ${JSON.stringify(actual)}`);
}

export async function appMarkets(ctx: ScenarioContext) {
	const [spotMeta, perpDexs, allPerpMetas] = await Promise.all([ctx.h.info.spotMeta(), ctx.h.info.perpDexs(), ctx.h.info.allPerpMetas()]);
	return parseMarkets({ spotMeta, perpDexs, allPerpMetas });
}

export async function cancelLikeTheApp(ctx: ScenarioContext, orders: { coin: string; oid: number }[]) {
	const markets = await appMarkets(ctx);
	const cancels = orders.map((order) => {
		const assetId = markets.byName.get(order.coin)?.assetId;
		if (typeof assetId !== "number") throw new Error(`the app finds no asset id for ${order.coin}, so it would skip this cancel`);
		return { a: assetId, o: order.oid };
	});
	return ctx.h.agent.cancel({ cancels });
}

export function expectSame(label: string, actual: string | number, expected: string | number): void {
	if (!toSafeBig(actual).eq(toSafeBig(expected))) throw new Error(`expected ${label} ${expected}, got ${actual}`);
}

export async function expectRejected(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
	try {
		await action();
	} catch (error) {
		if (pattern.test(errorMessage(error))) return;
		throw error;
	}
	throw new Error(`expected a rejection matching ${pattern}`);
}

const POLL_MS = 500;
const POLL_LIMIT_MS = 10_000;

export async function waitFor(label: string, check: () => Promise<boolean>): Promise<void> {
	const deadline = Date.now() + POLL_LIMIT_MS;
	while (!(await check())) {
		if (Date.now() > deadline) throw new Error(`${label} after ${POLL_LIMIT_MS / 1000}s`);
		await new Promise((resolve) => setTimeout(resolve, POLL_MS));
	}
}
