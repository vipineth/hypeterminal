import type { LimitTif } from "@/config/trade";
import { toSafeBig } from "@/lib/trade/numbers";
import { activeTwapIds, perpState, venueOrders } from "../account";
import { errorMessage, expectPosition, expectStatuses, priceStep, priceWithin } from "../assert";
import { intents, lotSize, plan, SCALE_LEVELS, scaleTotal, TWAP_MINUTES, TWAP_NOTIONAL, tickPrice, twapPlan } from "../plans";
import {
	appMarkets,
	cancelLikeTheApp,
	expectOrder,
	expectRejected,
	expectSame,
	fresh,
	openLong,
	openOrder,
	restingOid,
	type Scenario,
	type ScenarioContext,
	send,
	Unsupported,
	waitFor,
} from "./common";

async function restingLimit(ctx: ScenarioContext, factor: number, tif: LimitTif = "Gtc") {
	const venue = await fresh(ctx);
	const size = lotSize(venue);
	const price = tickPrice(venue, factor);
	const statuses = await send(ctx, plan(intents.limit(venue, "buy", size, price, tif)));
	expectStatuses(statuses, ["resting"]);
	const open = await openOrder(ctx, restingOid(statuses[0]));
	expectOrder(open, { side: "buy", price, size, tif });
	return { venue, open };
}

function expectedScaleLevels(start: string, end: string): string[] {
	const span = toSafeBig(end).minus(toSafeBig(start));
	return Array.from({ length: SCALE_LEVELS }, (_, level) =>
		toSafeBig(start)
			.plus(span.times(level).div(SCALE_LEVELS - 1))
			.toFixed(),
	);
}

export const orderScenarios: Scenario[] = [
	{
		name: "market",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			await openLong(ctx);
		},
	},
	{
		name: "limit",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			await restingLimit(ctx, 0.9);
		},
	},
	{
		name: "post-only",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { venue } = await restingLimit(ctx, 0.95, "Alo");
			const bestAsk = (await ctx.h.info.l2Book({ coin: venue.coin }))?.levels[1][0]?.px;
			if (!bestAsk) throw new Unsupported(`no asks on ${venue.coin} to cross`);
			await expectRejected(
				() => send(ctx, plan(intents.limit(venue, "buy", lotSize(venue), bestAsk, "Alo"))),
				/Post only order would have immediately matched/,
			);
		},
	},
	{
		name: "ioc",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			await expectRejected(() => send(ctx, plan(intents.limit(venue, "buy", size, tickPrice(venue, 0.9), "Ioc"))), /could not immediately match/);
			expectSame("open orders after an ioc that cannot fill", (await venueOrders(ctx.h, venue)).length, 0);
			expectStatuses(await send(ctx, plan(intents.limit(venue, "buy", size, tickPrice(venue, 1.02), "Ioc"))), ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, size);
		},
	},
	{
		name: "reduce-only",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { venue, size } = await openLong(ctx);
			expectStatuses(await send(ctx, plan(intents.market(venue, "sell", size, true))), ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
			await expectRejected(() => send(ctx, plan(intents.market(venue, "sell", size, true))), /Reduce only order would increase position/);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
		},
	},
	{
		name: "scale",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const [start, end] = [tickPrice(venue, 0.9), tickPrice(venue, 0.95)];
			const statuses = await send(ctx, plan(intents.scale(venue, scaleTotal(venue), start, end, SCALE_LEVELS)));
			expectStatuses(statuses, Array(SCALE_LEVELS).fill("resting"));
			const oids = new Set(statuses.map(restingOid));
			const open = (await venueOrders(ctx.h, venue))
				.filter((order) => oids.has(order.oid))
				.sort((a, b) => toSafeBig(a.limitPx).cmp(toSafeBig(b.limitPx)));
			expectSame("resting scale levels", open.length, SCALE_LEVELS);
			const levels = expectedScaleLevels(start, end);
			open.forEach((order, level) => {
				const step = priceStep(levels[level], venue.szDecimals, venue.kind);
				if (!priceWithin(order.limitPx, levels[level], step)) throw new Error(`scale level ${level} rests at ${order.limitPx}, expected ${levels[level]}`);
				expectOrder(order, { side: "buy", price: order.limitPx, size: lotSize(venue), tif: "Gtc" });
			});
		},
	},
	{
		name: "twap",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue, TWAP_NOTIONAL);
			const built = twapPlan(venue, "buy", size);
			if (!built.action) throw new Error(`the app refused to build the twap: ${built.errors.join(", ")}`);
			const response = await ctx.h.agent.twapOrder(built.action);
			const twapId = response.response.data.status.running.twapId;
			let state: { coin: string; side: string; sz: string; minutes: number; reduceOnly: boolean } | undefined;
			await waitFor(`twap ${twapId} never showed in twapHistory`, async () => {
				state = (await ctx.h.info.twapHistory({ user: ctx.h.user })).find((entry) => entry.twapId === twapId)?.state;
				return state !== undefined;
			});
			const actual = { coin: state?.coin, side: state?.side, sz: toSafeBig(state?.sz).toFixed(), minutes: state?.minutes, reduceOnly: state?.reduceOnly };
			const expected = { coin: venue.coin, side: "B", sz: toSafeBig(size).toFixed(), minutes: TWAP_MINUTES, reduceOnly: false };
			if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`twap state is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
			const assetId = (await appMarkets(ctx)).byName.get(venue.coin)?.assetId;
			if (typeof assetId !== "number") throw new Error(`the app finds no asset id for ${venue.coin}`);
			const cancelError = await ctx.h.agent
				.twapCancel({ a: assetId, t: twapId })
				.then(() => "")
				.catch(errorMessage);
			await waitFor(`twap ${twapId} still runs after cancel ${cancelError}`, async () => !(await activeTwapIds(ctx.h, venue.coin)).includes(twapId));
		},
	},
	{
		name: "cancel",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { open } = await restingLimit(ctx, 0.9);
			const response = await cancelLikeTheApp(ctx, [open]);
			expectSame("cancel statuses", response.response.data.statuses.length, 1);
			expectSame("open orders after cancel", (await venueOrders(ctx.h, ctx.venue)).length, 0);
		},
	},
	{
		name: "cancel all",
		signer: "agent",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			await restingLimit(ctx, 0.9);
			await restingLimit(ctx, 0.92);
			const open = await venueOrders(ctx.h, ctx.venue);
			expectSame("open orders before cancel all", open.length, 2);
			await cancelLikeTheApp(ctx, open);
			expectSame("open orders after cancel all", (await venueOrders(ctx.h, ctx.venue)).length, 0);
		},
	},
	{
		name: "modify",
		signer: "agent",
		scope: "perp",
		source: "sdk",
		run: async (ctx) => {
			const { venue, open } = await restingLimit(ctx, 0.9);
			const price = tickPrice(venue, 0.88);
			const [moved] = plan(intents.limit(venue, "buy", lotSize(venue), price)).orders;
			await ctx.h.agent.modify({ oid: open.oid, order: moved });
			const after = await venueOrders(ctx.h, venue);
			expectSame("open orders after modify", after.length, 1);
			expectOrder(after[0], { side: "buy", price, size: lotSize(venue) });
		},
	},
];
