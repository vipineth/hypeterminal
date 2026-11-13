import { toSafeBig } from "@/lib/trade/numbers";
import { spotBalance, spotBase } from "../account";
import { expectStatuses } from "../assert";
import { intents, lotSize, plan, SLIPPAGE_BPS } from "../plans";
import { fresh, liquidityWithinSlippage, type Scenario, send, Unsupported } from "./common";

const MAX_ROUND_TRIP_LOSS = 0.03;
const ROUND_DOWN = 0;

export const spotScenarios: Scenario[] = [
	{
		name: "spot buy and sell",
		scope: "spot",
		source: "app",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const base = spotBase(venue);
			const usdcBefore = toSafeBig(await spotBalance(ctx.h, "USDC"));
			const baseBefore = toSafeBig(await spotBalance(ctx.h, base));
			const size = lotSize(venue);

			const [bought] = await send(ctx, plan(intents.swap(venue, true, size)));
			expectStatuses([bought], ["filled"]);
			if (typeof bought === "object" && "filled" in bought && !toSafeBig(bought.filled.totalSz).eq(toSafeBig(size))) {
				const depth = await liquidityWithinSlippage(ctx, true);
				const message = `filled ${bought.filled.totalSz} of ${size} ${base}, ${depth.toFixed()} left within ${SLIPPAGE_BPS} bps of mark`;
				if (depth.gte(toSafeBig(size))) throw new Error(message);
				throw new Unsupported(message);
			}
			const received = toSafeBig(await spotBalance(ctx.h, base)).minus(baseBefore);
			if (received.lte(0) || received.gt(toSafeBig(size))) throw new Error(`received ${received.toFixed()} ${base}, ordered ${size}`);

			const sellSize = toSafeBig(await spotBalance(ctx.h, base)).round(venue.szDecimals, ROUND_DOWN).toFixed();
			expectStatuses(await send(ctx, plan(intents.swap(await fresh(ctx), false, sellSize))), ["filled"]);
			const usdcDelta = toSafeBig(await spotBalance(ctx.h, "USDC")).minus(usdcBefore);
			const baseDelta = toSafeBig(await spotBalance(ctx.h, base)).minus(baseBefore);
			const lost = usdcDelta.plus(baseDelta.times(toSafeBig(venue.markPx))).neg();
			if (lost.gt(toSafeBig(venue.markPx).times(size).times(MAX_ROUND_TRIP_LOSS))) {
				throw new Error(`the round trip lost ${lost.toFixed()} USDC of value, USDC moved ${usdcDelta.toFixed()}, ${base} moved ${baseDelta.toFixed()}`);
			}
		},
	},
];
