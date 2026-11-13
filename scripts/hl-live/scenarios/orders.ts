import { toSafeBig } from "@/lib/trade/numbers";
import { activeTwapIds, perpState, venueOrders } from "../account";
import { expectPosition, expectStatuses, harnessOrders } from "../assert";
import { intents, lotSize, plan, priceAt, SCALE_LEVELS, scaleTotal, TWAP_NOTIONAL, twapPlan } from "../plans";
import { expectRejected, expectSame, fresh, openLong, orderByCloid, type Scenario, send, Unsupported } from "./common";

const restingLimit: Scenario["run"] = async (ctx) => {
	const venue = await fresh(ctx);
	const { statuses, orders } = await send(ctx, plan(intents.limit(venue, "buy", lotSize(venue), priceAt(venue, 0.9))));
	expectStatuses(statuses, ["resting"]);
	const open = await orderByCloid(ctx, orders[0].c);
	expectSame("limit price", open.limitPx, orders[0].p);
	expectSame("size", open.sz, orders[0].s);
	if (open.side !== "B" || open.tif !== "Gtc") throw new Error(`expected a Gtc bid, got ${open.side} ${open.tif}`);
};

export const orderScenarios: Scenario[] = [
	{
		name: "market",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			await openLong(ctx);
		},
	},
	{ name: "limit", signer: "agent", scope: "perp", run: restingLimit },
	{
		name: "post-only",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const { statuses, orders } = await send(
				ctx,
				plan(intents.limit(venue, "buy", lotSize(venue), priceAt(venue, 0.95), "Alo")),
			);
			expectStatuses(statuses, ["resting"]);
			const open = await orderByCloid(ctx, orders[0].c);
			if (open.tif !== "Alo") throw new Error(`expected tif Alo, got ${open.tif}`);
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
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			const { statuses } = await send(ctx, plan(intents.limit(venue, "buy", size, priceAt(venue, 1.02), "Ioc")));
			expectStatuses(statuses, ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, size);
		},
	},
	{
		name: "reduce-only",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const { venue, size } = await openLong(ctx);
			const { statuses } = await send(ctx, plan(intents.market(venue, "sell", size, true)));
			expectStatuses(statuses, ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
			await expectRejected(
				() => send(ctx, plan(intents.market(venue, "sell", size, true))),
				/Reduce only order would increase position/,
			);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
		},
	},
	{
		name: "scale",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const total = scaleTotal(venue);
			const { statuses, orders } = await send(
				ctx,
				plan(intents.scale(venue, total, priceAt(venue, 0.9), priceAt(venue, 0.95), SCALE_LEVELS)),
			);
			expectStatuses(statuses, ["resting", "resting", "resting"]);
			const open = harnessOrders(await venueOrders(ctx.h, venue)).filter((order) =>
				orders.some((sent) => sent.c === order.cloid),
			);
			const restingTotal = open.reduce((sum, order) => sum.plus(toSafeBig(order.sz)), toSafeBig(0));
			expectSame("resting scale levels", open.length, SCALE_LEVELS);
			expectSame("scale total size", restingTotal.toFixed(), total);
		},
	},
	{
		name: "twap",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const built = twapPlan(venue, "buy", lotSize(venue, TWAP_NOTIONAL));
			if (!built.action) throw new Error(`the app refused to build the twap: ${built.errors.join(", ")}`);
			const response = await ctx.h.agent.twapOrder(built.action);
			const twapId = response.response.data.status.running.twapId;
			if (!(await activeTwapIds(ctx.h, venue.coin)).includes(twapId)) throw new Error(`twap ${twapId} is not running`);
			await ctx.h.agent.twapCancel({ a: venue.assetId, t: twapId });
			if ((await activeTwapIds(ctx.h, venue.coin)).includes(twapId)) throw new Error(`twap ${twapId} still runs after cancel`);
		},
	},
	{
		name: "cancel",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			await restingLimit(ctx);
			const [open] = harnessOrders(await venueOrders(ctx.h, ctx.venue));
			const response = await ctx.h.agent.cancel({ cancels: [{ a: ctx.venue.assetId, o: open.oid }] });
			expectSame("cancel statuses", response.response.data.statuses.length, 1);
			expectSame("open orders after cancel", (await venueOrders(ctx.h, ctx.venue)).length, 0);
		},
	},
	{
		name: "cancel all",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			const first = plan(intents.limit(venue, "buy", size, priceAt(venue, 0.9)));
			const second = plan(intents.limit(venue, "buy", size, priceAt(venue, 0.92)));
			const { statuses } = await send(ctx, { ...first, orders: [...first.orders, ...second.orders] });
			expectStatuses(statuses, ["resting", "resting"]);
			const open = await venueOrders(ctx.h, venue);
			expectSame("open orders before cancel all", open.length, 2);
			await ctx.h.agent.cancel({ cancels: open.map((order) => ({ a: venue.assetId, o: order.oid })) });
			expectSame("open orders after cancel all", (await venueOrders(ctx.h, venue)).length, 0);
		},
	},
	{
		name: "modify",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			const { orders } = await send(ctx, plan(intents.limit(venue, "buy", size, priceAt(venue, 0.9))));
			const before = await orderByCloid(ctx, orders[0].c);
			const [moved] = plan(intents.limit(venue, "buy", size, priceAt(venue, 0.88))).orders;
			await ctx.h.agent.modify({ oid: before.oid, order: { ...moved, c: orders[0].c } });
			const after = await orderByCloid(ctx, orders[0].c);
			expectSame("modified limit price", after.limitPx, moved.p);
			expectSame("modified size", after.sz, moved.s);
		},
	},
];
