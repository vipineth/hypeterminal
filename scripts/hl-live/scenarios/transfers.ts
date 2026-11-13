import type { ExchangeClient } from "@nktkas/hyperliquid";
import { toSafeBig } from "@/lib/trade/numbers";
import { enterUnified, exitUnified, SPOT_DEX, SPOT_FLOAT_USDC, spotBalance, usdcTokenId } from "../account";
import { errorMessage } from "../assert";
import { expectSame, type Scenario, type ScenarioContext, Unsupported } from "./common";

const AMOUNT = "1";
const DUST = 0.01;

async function venueUsdc(ctx: ScenarioContext, dex: string): Promise<string> {
	if (dex === SPOT_DEX) return spotBalance(ctx.h, "USDC");
	return (await ctx.h.info.clearinghouseState({ user: ctx.h.user, dex })).withdrawable;
}

async function usdcSplit(ctx: ScenarioContext) {
	const perp = (await ctx.h.info.clearinghouseState({ user: ctx.h.user })).marginSummary.accountValue;
	return { perp: toSafeBig(perp), spot: toSafeBig(await spotBalance(ctx.h, "USDC")) };
}

type SendAsset = (params: Parameters<ExchangeClient["sendAsset"]>[0]) => Promise<unknown>;

async function roundTrip(ctx: ScenarioContext, sendAsset: SendAsset): Promise<void> {
	const token = await usdcTokenId(ctx.h);
	const target = ctx.venue.dex === "" ? SPOT_DEX : ctx.venue.dex;
	const unified = (await ctx.h.info.userAbstraction({ user: ctx.h.user })) === "unifiedAccount";
	const home = unified && target !== SPOT_DEX ? SPOT_DEX : "";
	const move = (sourceDex: string, destinationDex: string) =>
		sendAsset({ destination: ctx.h.user, sourceDex, destinationDex, token, amount: AMOUNT });
	const before = await venueUsdc(ctx, target);
	try {
		await move(home, target);
	} catch (error) {
		const message = errorMessage(error);
		if (target !== SPOT_DEX && message.includes("Invalid send")) throw new Unsupported(`sendAsset into ${target}: ${message}`);
		throw error;
	}
	expectSame(`${target} USDC after sending in`, toSafeBig(await venueUsdc(ctx, target)).minus(toSafeBig(before)).toFixed(), AMOUNT);
	await move(target, home);
	const drift = toSafeBig(await venueUsdc(ctx, target)).minus(toSafeBig(before)).abs();
	if (drift.gt(DUST)) throw new Error(`${target} USDC did not return, off by ${drift.toFixed()}`);
}

export const transferScenarios: Scenario[] = [
	{
		name: "usd class transfer",
		signer: "principal",
		scope: "account",
		run: async (ctx) => {
			const before = await spotBalance(ctx.h, "USDC");
			await ctx.h.principal.usdClassTransfer({ amount: AMOUNT, toPerp: false });
			expectSame("spot USDC after perp to spot", toSafeBig(await spotBalance(ctx.h, "USDC")).minus(toSafeBig(before)).toFixed(), AMOUNT);
			await ctx.h.principal.usdClassTransfer({ amount: AMOUNT, toPerp: true });
			expectSame("spot USDC after spot to perp", await spotBalance(ctx.h, "USDC"), before);
		},
	},
	{
		name: "dex sendAsset",
		signer: "principal",
		scope: "perp",
		run: (ctx) => roundTrip(ctx, (params) => ctx.h.principal.sendAsset(params)),
	},
	{
		name: "agentSendAsset",
		signer: "agent",
		scope: "perp",
		run: (ctx) => roundTrip(ctx, (params) => ctx.h.agent.agentSendAsset(params)),
	},
	{
		name: "abstraction switch",
		signer: "principal",
		scope: "account",
		run: async (ctx) => {
			const before = await usdcSplit(ctx);
			try {
				await enterUnified(ctx.h);
			} finally {
				await exitUnified(ctx.h);
			}
			const after = await usdcSplit(ctx);
			const change = after.perp.plus(after.spot).minus(before.perp.plus(before.spot));
			if (change.abs().gt(DUST)) throw new Error(`USDC changed by ${change.toFixed()} across unified, perp ${before.perp.toFixed()} became ${after.perp.toFixed()}`);
			if (after.spot.minus(SPOT_FLOAT_USDC).abs().gt(1)) throw new Error(`spot USDC ${after.spot.toFixed()} did not return to the ${SPOT_FLOAT_USDC} float`);
		},
	},
	{
		name: "agentSetAbstraction",
		signer: "agent",
		scope: "account",
		run: async (ctx) => {
			const before = await ctx.h.info.userAbstraction({ user: ctx.h.user });
			try {
				await enterUnified(ctx.h, () => ctx.h.agent.agentSetAbstraction({ abstraction: "u" }));
			} catch (error) {
				const message = errorMessage(error);
				if (message.includes("Abstraction transition not allowed")) {
					throw new Unsupported(`agentSetAbstraction from ${before}: ${message}`);
				}
				throw error;
			} finally {
				await exitUnified(ctx.h);
			}
		},
	},
];
