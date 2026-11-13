import type { ExchangeClient } from "@nktkas/hyperliquid";
import { toSafeBig } from "@/lib/trade/numbers";
import { enterUnified, exitUnified, SPOT_DEX, spotBalance } from "../account";
import { expectSame, type Scenario, type ScenarioContext, Unsupported } from "./common";

const AMOUNT = "1";
const DUST = 0.01;

async function usdcToken(ctx: ScenarioContext): Promise<string> {
	const meta = await ctx.h.info.spotMeta();
	const usdc = meta.tokens.find((token) => token.name === "USDC");
	if (!usdc) throw new Error("USDC is not a spot token");
	return `${usdc.name}:${usdc.tokenId}`;
}

async function venueUsdc(ctx: ScenarioContext, dex: string): Promise<string> {
	if (dex === SPOT_DEX) return spotBalance(ctx.h, "USDC");
	return (await ctx.h.info.clearinghouseState({ user: ctx.h.user, dex })).withdrawable;
}

type SendAsset = (params: Parameters<ExchangeClient["sendAsset"]>[0]) => Promise<unknown>;

async function roundTrip(ctx: ScenarioContext, sendAsset: SendAsset): Promise<void> {
	const token = await usdcToken(ctx);
	const target = ctx.venue.dex === "" ? SPOT_DEX : ctx.venue.dex;
	const move = (sourceDex: string, destinationDex: string) =>
		sendAsset({ destination: ctx.h.user, sourceDex, destinationDex, token, amount: AMOUNT });
	const before = await venueUsdc(ctx, target);
	try {
		await move("", target);
	} catch (error) {
		const message = (error as Error).message;
		if (target !== SPOT_DEX && message.includes("Invalid send")) throw new Unsupported(`sendAsset into ${target}: ${message}`);
		throw error;
	}
	expectSame(`${target} USDC after sending in`, toSafeBig(await venueUsdc(ctx, target)).minus(toSafeBig(before)).toFixed(), AMOUNT);
	await move(target, "");
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
			const perpBefore = (await ctx.h.info.clearinghouseState({ user: ctx.h.user })).withdrawable;
			try {
				await enterUnified(ctx.h);
			} finally {
				await exitUnified(ctx.h);
			}
			const perpAfter = (await ctx.h.info.clearinghouseState({ user: ctx.h.user })).withdrawable;
			const drift = toSafeBig(perpAfter).minus(toSafeBig(perpBefore)).abs();
			if (drift.gt(DUST)) throw new Error(`perp USDC did not come back from unified, ${perpBefore} became ${perpAfter}`);
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
				const message = (error as Error).message;
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
