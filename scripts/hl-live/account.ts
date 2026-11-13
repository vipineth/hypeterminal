import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { InfoClient } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import { getBuilderPerpAssetId, getPerpAssetId, getSpotAssetId } from "@/lib/hyperliquid/markets/helper";
import { toSafeBig } from "@/lib/trade/numbers";
import { positionSize } from "./assert";
import type { Harness } from "./harness";
import type { PlanMarket } from "./plans";

export interface VenueSpec {
	label: string;
	dex: string;
	coin: string;
}

export interface Venue extends PlanMarket, VenueSpec {
	baseToken: string | null;
}

export const SPOT_DEX = "spot";
const CLEANUP_SLIPPAGE = 0.1;
const MIN_SPOT_SELL_NOTIONAL = 10;
const ROUND_DOWN = 0;

export async function loadVenue(info: InfoClient, spec: VenueSpec): Promise<Venue> {
	if (spec.dex === SPOT_DEX) {
		const [meta, ctxs] = await info.spotMetaAndAssetCtxs();
		const pair = meta.universe.find((entry) => entry.name === spec.coin);
		const base = pair && meta.tokens.find((token) => token.index === pair.tokens[0]);
		if (!pair || !base) throw new Error(`spot pair ${spec.coin} is not listed`);
		return {
			...spec,
			assetId: getSpotAssetId(pair.index),
			szDecimals: base.szDecimals,
			kind: "spot",
			markPx: ctxs[pair.index].markPx,
			baseToken: base.name,
		};
	}
	const [meta, ctxs] = await info.metaAndAssetCtxs({ dex: spec.dex });
	const assetIndex = meta.universe.findIndex((asset) => asset.name === spec.coin);
	if (assetIndex < 0) throw new Error(`${spec.coin} is not listed on ${spec.dex || "the main dex"}`);
	const dexIndex = spec.dex === "" ? 0 : (await info.perpDexs()).findIndex((dex) => dex?.name === spec.dex);
	return {
		...spec,
		assetId: dexIndex === 0 ? getPerpAssetId(assetIndex) : getBuilderPerpAssetId(dexIndex, assetIndex),
		szDecimals: meta.universe[assetIndex].szDecimals,
		kind: dexIndex === 0 ? "perp" : "builderPerp",
		markPx: ctxs[assetIndex].markPx,
		baseToken: null,
	};
}

export function perpState(h: Harness, venue: Venue) {
	return h.info.clearinghouseState({ user: h.user, dex: venue.dex });
}

export async function venueOrders(h: Harness, venue: Venue) {
	const dex = venue.dex === SPOT_DEX ? "" : venue.dex;
	const orders = await h.info.frontendOpenOrders({ user: h.user, dex });
	return orders.filter((order) => order.coin === venue.coin);
}

export async function spotBalance(h: Harness, coin: string): Promise<string> {
	const { balances } = await h.info.spotClearinghouseState({ user: h.user });
	return balances.find((balance) => balance.coin === coin)?.total ?? "0";
}

export async function activeTwapIds(h: Harness, coin: string): Promise<number[]> {
	const history = await h.info.twapHistory({ user: h.user });
	const latest = new Map<number, string>();
	for (const entry of [...history].sort((a, b) => a.time - b.time)) {
		if (entry.twapId !== undefined && entry.state.coin === coin) latest.set(entry.twapId, entry.status.status);
	}
	return [...latest].filter(([, status]) => status === "activated").map(([twapId]) => twapId);
}

function aggressivePrice(venue: Venue, isBuy: boolean): string {
	const factor = isBuy ? 1 + CLEANUP_SLIPPAGE : 1 - CLEANUP_SLIPPAGE;
	return formatPrice(toSafeBig(venue.markPx).times(factor).toFixed(), venue.szDecimals, venue.kind === "spot" ? "spot" : "perp");
}

async function closeExposure(h: Harness, venue: Venue): Promise<void> {
	if (venue.kind === "spot") {
		const held = toSafeBig(await spotBalance(h, venue.baseToken ?? ""));
		if (held.times(toSafeBig(venue.markPx)).lt(MIN_SPOT_SELL_NOTIONAL)) return;
		const size = formatSize(held.round(venue.szDecimals, ROUND_DOWN).toFixed(), venue.szDecimals);
		await h.agent.order({
			orders: [{ a: venue.assetId, b: false, p: aggressivePrice(venue, false), s: size, r: false, t: { limit: { tif: "Ioc" } } }],
			grouping: "na",
		});
		return;
	}
	const szi = toSafeBig(positionSize(await perpState(h, venue), venue.coin));
	if (szi.eq(0)) return;
	const isBuy = szi.lt(0);
	await h.agent.order({
		orders: [
			{
				a: venue.assetId,
				b: isBuy,
				p: aggressivePrice(venue, isBuy),
				s: formatSize(szi.abs().toFixed(), venue.szDecimals),
				r: true,
				t: { limit: { tif: "Ioc" } },
			},
		],
		grouping: "na",
	});
}

async function ignoreRace(action: () => Promise<unknown>): Promise<void> {
	try {
		await action();
	} catch {}
}

export async function cleanVenue(h: Harness, spec: VenueSpec): Promise<void> {
	const venue = await loadVenue(h.info, spec);
	for (const twapId of await activeTwapIds(h, venue.coin)) {
		await ignoreRace(() => h.agent.twapCancel({ a: venue.assetId, t: twapId }));
	}
	const orders = await venueOrders(h, venue);
	if (orders.length > 0) {
		await ignoreRace(() => h.agent.cancel({ cancels: orders.map((order) => ({ a: venue.assetId, o: order.oid })) }));
	}
	await ignoreRace(() => closeExposure(h, venue));

	const leftOrders = await venueOrders(h, venue);
	if (leftOrders.length > 0) throw new Error(`cleanup left ${leftOrders.length} open orders on ${venue.coin}`);
	if (venue.kind !== "spot") {
		const left = positionSize(await perpState(h, venue), venue.coin);
		if (!toSafeBig(left).eq(0)) throw new Error(`cleanup left a ${venue.coin} position of ${left}`);
	}
}

function statePath(user: string, name: string): string {
	return join(tmpdir(), `hl-live-${user.toLowerCase()}.${name}`);
}

export function acquireLock(user: string): () => void {
	const path = statePath(user, "lock");
	if (existsSync(path)) {
		const pid = Number(readFileSync(path, "utf8"));
		try {
			process.kill(pid, 0);
			throw new Error(`another harness run (pid ${pid}) holds ${path}, runs on one principal must not overlap`);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
		}
	}
	writeFileSync(path, String(process.pid));
	return () => {
		if (existsSync(path) && readFileSync(path, "utf8") === String(process.pid)) unlinkSync(path);
	};
}

export async function enterUnified(h: Harness, switchMode = () => h.principal.userSetAbstraction({ user: h.user, abstraction: "unifiedAccount" })): Promise<void> {
	const spotUsdcBefore = await spotBalance(h, "USDC");
	writeFileSync(statePath(h.user, "unified.json"), JSON.stringify({ spotUsdcBefore }));
	await switchMode();
	const mode = await h.info.userAbstraction({ user: h.user });
	if (mode !== "unifiedAccount") throw new Error(`expected unifiedAccount after the switch, read ${mode}`);
}

export async function exitUnified(h: Harness): Promise<void> {
	const path = statePath(h.user, "unified.json");
	if (!existsSync(path)) return;
	const { spotUsdcBefore } = JSON.parse(readFileSync(path, "utf8")) as { spotUsdcBefore: string };
	if ((await h.info.userAbstraction({ user: h.user })) === "unifiedAccount") {
		await h.principal.userSetAbstraction({ user: h.user, abstraction: "disabled" });
		const mode = await h.info.userAbstraction({ user: h.user });
		if (mode !== "disabled") throw new Error(`expected disabled after leaving unified, read ${mode}`);
	}
	const surplus = toSafeBig(await spotBalance(h, "USDC")).minus(toSafeBig(spotUsdcBefore)).round(6, ROUND_DOWN);
	if (surplus.gt(0)) await h.principal.usdClassTransfer({ amount: surplus.toFixed(), toPerp: true });
	unlinkSync(path);
}
