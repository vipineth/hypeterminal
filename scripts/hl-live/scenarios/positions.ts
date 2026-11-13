import { toSafeBig } from "@/lib/trade/numbers";
import { cleanVenue, perpState, venueOrders } from "../account";
import { expectPosition, expectStatuses } from "../assert";
import { intents, lotSize, plan, tickPrice } from "../plans";
import { currentPosition, expectRejected, fresh, openLong, type Scenario, type ScenarioContext, send } from "./common";

const HARNESS_LEVERAGE = 5;
const MARGIN_ADD_USD = 2;
const MARGIN_REMOVE_USD = 1;
const MICRO_USD = 1_000_000;
const MARGIN_TOLERANCE = 0.05;

interface ExpectedTrigger {
	kind: "tp" | "sl";
	side: "A" | "B";
	triggerPx: string;
	size: string;
}

const TRIGGER_TYPES: Record<ExpectedTrigger["kind"], string> = { tp: "Take Profit Market", sl: "Stop Market" };

async function expectTriggers(ctx: ScenarioContext, expected: ExpectedTrigger[], isPositionTpsl: boolean) {
	const remaining = (await venueOrders(ctx.h, ctx.venue)).filter((order) => order.isTrigger);
	const describe = remaining.map((order) => `${order.orderType} ${order.side} ${order.sz} at ${order.triggerPx}`);
	for (const want of expected) {
		const index = remaining.findIndex(
			(order) =>
				order.orderType === TRIGGER_TYPES[want.kind] &&
				order.side === want.side &&
				order.reduceOnly &&
				order.isPositionTpsl === isPositionTpsl &&
				toSafeBig(order.triggerPx).eq(toSafeBig(want.triggerPx)) &&
				toSafeBig(order.sz).eq(toSafeBig(want.size)),
		);
		if (index < 0) throw new Error(`no open ${TRIGGER_TYPES[want.kind]} ${want.side} ${want.size} at ${want.triggerPx}, open: ${describe.join("; ")}`);
		remaining.splice(index, 1);
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
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const size = lotSize(venue);
			const [tp, sl] = [tickPrice(venue, 1.3), tickPrice(venue, 0.7)];
			const built = plan(intents.marketWithTpSl(venue, size, tp, sl));
			if (built.grouping !== "normalTpsl") throw new Error(`expected normalTpsl grouping, got ${built.grouping}`);
			expectStatuses(await send(ctx, built), ["filled", "waitingForTrigger", "waitingForTrigger"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, size);
			await expectTriggers(
				ctx,
				[
					{ kind: "tp", side: "A", triggerPx: tp, size },
					{ kind: "sl", side: "A", triggerPx: sl, size },
				],
				false,
			);
		},
	},
	{
		name: "tpsl positionTpsl",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { venue } = await openLong(ctx);
			const [tp, sl] = [tickPrice(venue, 1.3), tickPrice(venue, 0.7)];
			const built = plan(intents.positionTpSl(venue, true, tp, sl));
			if (built.grouping !== "positionTpsl") throw new Error(`expected positionTpsl grouping, got ${built.grouping}`);
			expectStatuses(await send(ctx, built), ["waitingForTrigger", "waitingForTrigger"]);
			await expectTriggers(
				ctx,
				[
					{ kind: "tp", side: "A", triggerPx: tp, size: "0" },
					{ kind: "sl", side: "A", triggerPx: sl, size: "0" },
				],
				true,
			);
		},
	},
	{
		name: "close",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { venue } = await openLong(ctx);
			const held = toSafeBig(await currentPosition(ctx)).abs().toFixed();
			expectStatuses(await send(ctx, plan(intents.close(venue, held, true))), ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
			await expectRejected(() => send(ctx, plan(intents.close(venue, held, true))), /Reduce only order would increase position/);
			expectPosition(await perpState(ctx.h, venue), venue.coin, 0);
		},
	},
	{
		name: "reverse",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const { venue, size } = await openLong(ctx);
			expectStatuses(await send(ctx, plan(intents.reverse(venue, size, true))), ["filled"]);
			expectPosition(await perpState(ctx.h, venue), venue.coin, toSafeBig(size).neg());
		},
	},
	{
		name: "leverage update",
		scope: "perp",
		source: "app",
		run: async (ctx) => {
			const before = await leverage(ctx);
			const target = before.value === 3 ? 4 : 3;
			try {
				await ctx.h.agent.updateLeverage({ asset: ctx.venue.assetId, isCross: true, leverage: target });
				const after = await leverage(ctx);
				if (after.type !== "cross" || after.value !== target) throw new Error(`expected cross ${target}x, read ${JSON.stringify(after)}`);
			} finally {
				await resetLeverage(ctx);
			}
		},
	},
	{
		name: "isolated margin",
		scope: "perp",
		source: "sdk",
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
