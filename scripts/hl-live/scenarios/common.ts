import type { ExchangeOrder } from "@/config/trade";
import type { OrderPlan } from "@/domain/trade/order-intent";
import { toSafeBig } from "@/lib/trade/numbers";
import { type Venue, loadVenue, perpState, venueOrders } from "../account";
import { bookTooThin, expectPosition, expectStatuses, newCloid, type OrderStatus, positionSize } from "../assert";
import type { Harness } from "../harness";
import { intents, lotSize, plan } from "../plans";

export type Scope = "perp" | "spot" | "account";

export interface ScenarioContext {
	h: Harness;
	venue: Venue;
}

export interface Scenario {
	name: string;
	signer: "agent" | "principal";
	scope: Scope;
	run(ctx: ScenarioContext): Promise<void>;
}

export class Unsupported extends Error {}

export type TaggedOrder = ExchangeOrder & { c: `0x${string}` };

const NO_MATCH = "could not immediately match";

export async function fresh(ctx: ScenarioContext): Promise<Venue> {
	return loadVenue(ctx.h.info, ctx.venue);
}

export async function send(ctx: ScenarioContext, built: OrderPlan): Promise<{ statuses: OrderStatus[]; orders: TaggedOrder[] }> {
	const orders = built.orders.map((order) => ({ ...order, c: newCloid() }));
	try {
		const response = await ctx.h.agent.order({ orders, grouping: built.grouping });
		return { statuses: response.response.data.statuses, orders };
	} catch (error) {
		const [first] = orders;
		if (String((error as Error).message).includes(NO_MATCH) && first) {
			const book = await ctx.h.info.l2Book({ coin: ctx.venue.coin });
			if (bookTooThin(book, first.b, first.p)) {
				throw new Unsupported(`book too thin to fill ${first.b ? "a buy" : "a sell"} at ${first.p} on ${ctx.venue.coin}`);
			}
		}
		throw error;
	}
}

export async function openLong(ctx: ScenarioContext, size?: string): Promise<{ venue: Venue; size: string }> {
	const venue = await fresh(ctx);
	const lot = size ?? lotSize(venue);
	const { statuses } = await send(ctx, plan(intents.market(venue, "buy", lot)));
	expectStatuses(statuses, ["filled"]);
	expectPosition(await perpState(ctx.h, venue), venue.coin, lot);
	return { venue, size: lot };
}

export async function currentPosition(ctx: ScenarioContext): Promise<string> {
	return positionSize(await perpState(ctx.h, ctx.venue), ctx.venue.coin);
}

export async function orderByCloid(ctx: ScenarioContext, cloid: string) {
	const order = (await venueOrders(ctx.h, ctx.venue)).find((entry) => entry.cloid === cloid);
	if (!order) throw new Error(`order ${cloid} is not open on ${ctx.venue.coin}`);
	return order;
}

export function expectSame(label: string, actual: string | number, expected: string | number): void {
	if (!toSafeBig(actual).eq(toSafeBig(expected))) throw new Error(`expected ${label} ${expected}, got ${actual}`);
}

export async function expectRejected(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
	try {
		await action();
	} catch (error) {
		if (pattern.test((error as Error).message)) return;
		throw error;
	}
	throw new Error(`expected a rejection matching ${pattern}`);
}
