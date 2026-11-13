import { toSafeBig } from "@/lib/trade/numbers";
import { spotBalance } from "../account";
import { expectStatuses } from "../assert";
import { intents, lotSize, plan } from "../plans";
import { fresh, type Scenario, send } from "./common";

const MAX_ROUND_TRIP_LOSS = 0.03;
const ROUND_DOWN = 0;

export const spotScenarios: Scenario[] = [
	{
		name: "spot buy and sell",
		signer: "agent",
		scope: "spot",
		run: async (ctx) => {
			const venue = await fresh(ctx);
			const base = venue.baseToken ?? "";
			const usdcBefore = toSafeBig(await spotBalance(ctx.h, "USDC"));
			const baseBefore = toSafeBig(await spotBalance(ctx.h, base));
			const size = lotSize(venue);

			expectStatuses((await send(ctx, plan(intents.swap(venue, true, size)))).statuses, ["filled"]);
			const bought = toSafeBig(await spotBalance(ctx.h, base)).minus(baseBefore);
			if (bought.lte(0) || bought.gt(toSafeBig(size))) throw new Error(`bought ${bought.toFixed()} ${base}, ordered ${size}`);

			const sellSize = toSafeBig(await spotBalance(ctx.h, base)).round(venue.szDecimals, ROUND_DOWN).toFixed();
			expectStatuses((await send(ctx, plan(intents.swap(await fresh(ctx), false, sellSize)))).statuses, ["filled"]);
			const usdcDelta = toSafeBig(await spotBalance(ctx.h, "USDC")).minus(usdcBefore);
			const baseDelta = toSafeBig(await spotBalance(ctx.h, base)).minus(baseBefore);
			const lost = usdcDelta.plus(baseDelta.times(toSafeBig(venue.markPx))).neg();
			if (lost.gt(toSafeBig(venue.markPx).times(size).times(MAX_ROUND_TRIP_LOSS))) {
				throw new Error(`the round trip lost ${lost.toFixed()} USDC of value, USDC moved ${usdcDelta.toFixed()}, ${base} moved ${baseDelta.toFixed()}`);
			}
		},
	},
];
