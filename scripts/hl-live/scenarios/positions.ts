import { toSafeBig } from "@/lib/trade/numbers";
import { cleanVenue, perpState, venueOrders } from "../account";
import { expectPosition, expectStatuses } from "../assert";
import { intents, lotSize, plan, priceAt } from "../plans";
import { currentPosition, fresh, openLong, type Scenario, type ScenarioContext, send, type TaggedOrder } from "./common";

const HARNESS_LEVERAGE = 5;
const MARGIN_ADD_USD = 2;
const MARGIN_REMOVE_USD = 1;
const MICRO_USD = 1_000_000;
const MARGIN_TOLERANCE = 0.05;

async function expectTriggers(ctx: ScenarioContext, sent: TaggedOrder[], isPositionTpsl: boolean) {
	const open = await venueOrders(ctx.h, ctx.venue);
	for (const order of sent) {
		if (!("trigger" in order.t)) continue;
		const { triggerPx, tpsl } = order.t.trigger;
		const match = open.find((entry) => entry.isTrigger && entry.reduceOnly && toSafeBig(entry.triggerPx).eq(toSafeBig(triggerPx)));
		if (!match) throw new Error(`no open ${tpsl} trigger at ${triggerPx}, open: ${JSON.stringify(open.map((entry) => entry.triggerPx))}`);
		if (match.isPositionTpsl !== isPositionTpsl) throw new Error(`${tpsl} trigger isPositionTpsl is ${match.isPositionTpsl}`);
	}
}

async function leverage(ctx: ScenarioContext) {
	const data = await ctx.h.info.activeAssetData({ user: ctx.h.user, coin: ctx.venue.coin });
	return data.leverage;
}

async function marginUsed(ctx: ScenarioContext): Promise<string> {
	const state = await perpState(ctx.h, ctx.venue);
	const entry = state.assetPositions.find((position) => position.position.coin === ctx.venue.coin);
	if (!entry) throw new Error(`no ${ctx.venue.coin} position`);
	return entry.position.marginUsed;
}

function expectMarginStep(label: string, before: string, after: string, step: number) {
	const delta = toSafeBig(after).minus(toSafeBig(before));
	if (delta.minus(step).abs().gt(MARGIN_TOLERANCE)) throw new Error(`${label} moved margin by ${delta.toFixed()}, expected ${step}`);
}

export async function resetLeverage(ctx: ScenarioContext): Promise<void> {
	await ctx.h.agent.updateLeverage({ asset: ctx.venue.assetId, isCross: true, leverage: HARNESS_LEVERAGE });
}

export const positionScenarios: Scenario[] = [
	{
		name: "tpsl normalTpsl",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			const built = plan(intents.marketWithTpSl(venue, size, priceAt(venue, 1.3), priceAt(venue, 0.7)));
			if (built.grouping !== "normalTpsl") throw new Error(`expected normalTpsl grouping, got ${built.grouping}`);
			const { statuses, orders } = await send(ctx, built);
			expectStatuses(statuses, ["filled", "waitingForTrigger", "waitingForTrigger"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, size);
			await expectTriggers(ctx, orders, false);
		},
	},
	{
		name: "tpsl positionTpsl",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const { venue } = await openLong(ctx);
			const built = plan(intents.positionTpSl(venue, true, priceAt(venue, 1.3), priceAt(venue, 0.7)));
			if (built.grouping !== "positionTpsl") throw new Error(`expected positionTpsl grouping, got ${built.grouping}`);
			const { statuses, orders } = await send(ctx, built);
			expectStatuses(statuses, ["waitingForTrigger", "waitingForTrigger"]);
			await expectTriggers(ctx, orders, true);
		},
	},
	{
		name: "close",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const { venue } = await openLong(ctx);
			const held = await currentPosition(ctx);
			const { statuses } = await send(ctx, plan(intents.close(venue, toSafeBig(held).abs().toFixed(), true)));
			expectStatuses(statuses, ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
		},
	},
	{
		name: "reverse",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const { venue, size } = await openLong(ctx);
			const { statuses } = await send(ctx, plan(intents.reverse(venue, size, true)));
			expectStatuses(statuses, ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, toSafeBig(size).neg());
		},
	},
	{
		name: "leverage update",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			const before = await leverage(ctx);
			const target = before.value === 3 ? 4 : 3;
			await ctx.h.agent.updateLeverage({ asset: ctx.venue.assetId, isCross: true, leverage: target });
			const after = await leverage(ctx);
			if (after.type !== "cross" || after.value !== target) throw new Error(`expected cross ${target}x, read ${JSON.stringify(after)}`);
			await resetLeverage(ctx);
		},
	},
	{
		name: "isolated margin",
		signer: "agent",
		scope: "perp",
		run: async (ctx) => {
			await ctx.h.agent.updateLeverage({ asset: ctx.venue.assetId, isCross: false, leverage: HARNESS_LEVERAGE });
			try {
				await openLong(ctx);
				const start = await marginUsed(ctx);
				await ctx.h.agent.updateIsolatedMargin({ asset: ctx.venue.assetId, isBuy: true, ntli: MARGIN_ADD_USD * MICRO_USD });
				const added = await marginUsed(ctx);
				expectMarginStep("adding margin", start, added, MARGIN_ADD_USD);
				await ctx.h.agent.updateIsolatedMargin({ asset: ctx.venue.assetId, isBuy: true, ntli: -MARGIN_REMOVE_USD * MICRO_USD });
				expectMarginStep("removing margin", added, await marginUsed(ctx), -MARGIN_REMOVE_USD);
			} finally {
				await cleanVenue(ctx.h, ctx.venue);
				await resetLeverage(ctx);
			}
		},
	},
];
