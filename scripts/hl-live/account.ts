import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { InfoClient } from "@nktkas/hyperliquid";
import { formatPrice, formatSize } from "@nktkas/hyperliquid/utils";
import { DEFAULT_QUOTE_TOKEN, HL_ALL_DEXS } from "@/config/app";
import { getBuilderPerpAssetId, getDexFromName, getPerpAssetId, getSpotAssetId } from "@/lib/hyperliquid/markets/helper";
import { toSafeBig } from "@/lib/trade/numbers";
import { formatTokenId } from "@/lib/trade/token-id";
import { errorMessage, positionSize } from "./assert";
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
export const SPOT_FLOAT_USDC = 30;
const SPLIT_TOLERANCE_USDC = 1;
const USDC_DECIMALS = 6;
const SWEEP_BATCH = 10;
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

export function spotBase(venue: Venue): string {
	if (!venue.baseToken) throw new Error(`${venue.coin} has no spot base token`);
	return venue.baseToken;
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

async function activeTwaps(h: Harness): Promise<{ twapId: number; coin: string }[]> {
	const history = await h.info.twapHistory({ user: h.user });
	const latest = new Map<number, { status: string; coin: string }>();
	for (const entry of [...history].sort((a, b) => a.time - b.time)) {
		if (entry.twapId !== undefined) latest.set(entry.twapId, { status: entry.status.status, coin: entry.state.coin });
	}
	return [...latest].filter(([, twap]) => twap.status === "activated").map(([twapId, twap]) => ({ twapId, coin: twap.coin }));
}

export async function activeTwapIds(h: Harness, coin?: string): Promise<number[]> {
	return (await activeTwaps(h)).filter((twap) => coin === undefined || twap.coin === coin).map((twap) => twap.twapId);
}

function aggressivePrice(venue: Venue, isBuy: boolean): string {
	const factor = isBuy ? 1 + CLEANUP_SLIPPAGE : 1 - CLEANUP_SLIPPAGE;
	return formatPrice(toSafeBig(venue.markPx).times(factor).toFixed(), venue.szDecimals, venue.kind === "spot" ? "spot" : "perp");
}

async function closeExposure(h: Harness, venue: Venue): Promise<void> {
	if (venue.kind === "spot") {
		const held = toSafeBig(await spotBalance(h, spotBase(venue)));
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

export async function cleanVenue(h: Harness, spec: VenueSpec): Promise<void> {
	const venue = await loadVenue(h.info, spec);
	const failures: string[] = [];
	const attempt = (action: () => Promise<unknown>) =>
		action().catch((error: unknown) => {
			failures.push(errorMessage(error));
		});
	for (const twapId of await activeTwapIds(h, venue.coin)) {
		await attempt(() => h.agent.twapCancel({ a: venue.assetId, t: twapId }));
	}
	const orders = await venueOrders(h, venue);
	if (orders.length > 0) {
		await attempt(() => h.agent.cancel({ cancels: orders.map((order) => ({ a: venue.assetId, o: order.oid })) }));
	}
	await attempt(() => closeExposure(h, venue));

	const left: string[] = [];
	const twaps = await activeTwapIds(h, venue.coin);
	if (twaps.length > 0) left.push(`${twaps.length} running twaps`);
	const leftOrders = await venueOrders(h, venue);
	if (leftOrders.length > 0) left.push(`${leftOrders.length} open orders`);
	if (venue.kind === "spot") {
		const held = toSafeBig(await spotBalance(h, spotBase(venue)));
		if (held.times(toSafeBig(venue.markPx)).gte(MIN_SPOT_SELL_NOTIONAL)) left.push(`${held.toFixed()} ${spotBase(venue)}`);
	} else {
		const size = positionSize(await perpState(h, venue), venue.coin);
		if (!toSafeBig(size).eq(0)) left.push(`a position of ${size}`);
	}
	if (left.length > 0) throw new Error(`cleanup left ${left.join(", ")} on ${venue.coin}: ${failures.join("; ")}`);
}

function isAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code !== "ESRCH";
	}
}

export function acquireLock(user: string): () => void {
	const path = join(tmpdir(), `hl-live-${user.toLowerCase()}.lock`);
	if (existsSync(path)) {
		const pid = Number(readFileSync(path, "utf8"));
		if (isAlive(pid)) throw new Error(`another harness run (pid ${pid}) holds ${path}, runs on one principal must not overlap`);
	}
	writeFileSync(path, String(process.pid));
	return () => {
		if (existsSync(path) && readFileSync(path, "utf8") === String(process.pid)) unlinkSync(path);
	};
}

interface AccountScan {
	twapCoins: string[];
	positions: { dex: string; coins: string[] }[];
	orders: { dex: string; coins: string[] }[];
	collateralDexes: string[];
}

async function scanAccount(h: Harness): Promise<AccountScan> {
	const twapCoins = (await activeTwaps(h)).map((twap) => twap.coin);
	const dexes = (await h.info.perpDexs()).map((dex) => dex?.name ?? "");
	const positions: AccountScan["positions"] = [];
	const collateralDexes: string[] = [];
	for (let start = 0; start < dexes.length; start += SWEEP_BATCH) {
		await Promise.all(
			dexes.slice(start, start + SWEEP_BATCH).map(async (dex) => {
				const state = await h.info.clearinghouseState({ user: h.user, dex });
				if (state.assetPositions.length > 0) positions.push({ dex, coins: state.assetPositions.map((entry) => entry.position.coin) });
				if (dex !== "" && !toSafeBig(state.marginSummary.accountValue).eq(0)) collateralDexes.push(dex);
			}),
		);
	}
	const orders: AccountScan["orders"] = [];
	for (const dex of [HL_ALL_DEXS, ...collateralDexes]) {
		const open = await h.info.frontendOpenOrders({ user: h.user, dex });
		if (open.length > 0) orders.push({ dex, coins: open.map((order) => order.coin) });
	}
	return { twapCoins, positions, orders, collateralDexes };
}

function describeActivity(scan: AccountScan): string[] {
	return [
		...(scan.twapCoins.length > 0 ? [`${scan.twapCoins.length} running twaps`] : []),
		...scan.positions.map(({ dex, coins }) => `${coins.length} positions on ${dex || "the main dex"}`),
		...scan.orders.map(({ dex, coins }) => `${coins.length} orders on ${dex === HL_ALL_DEXS ? "all dexes" : dex}`),
	];
}

function venueForCoin(coin: string): VenueSpec {
	const dex = getDexFromName(coin);
	if (dex) return { label: dex, dex, coin };
	if (coin.startsWith("@") || coin.includes("/")) return { label: SPOT_DEX, dex: SPOT_DEX, coin };
	return { label: "main", dex: "", coin };
}

function scannedVenues(scan: AccountScan): VenueSpec[] {
	const coins = [...scan.twapCoins, ...scan.positions.flatMap((entry) => entry.coins), ...scan.orders.flatMap((entry) => entry.coins)];
	return coins.map(venueForCoin);
}

function uniqueVenues(venues: VenueSpec[]): VenueSpec[] {
	return [...new Map(venues.map((venue) => [`${venue.dex}|${venue.coin}`, venue])).values()];
}

function isBuilderDex(dex: string): boolean {
	return dex !== "" && dex !== SPOT_DEX;
}

export async function enterUnified(h: Harness, switchMode = () => h.principal.userSetAbstraction({ user: h.user, abstraction: "unifiedAccount" })): Promise<void> {
	if ((await h.info.userAbstraction({ user: h.user })) === "unifiedAccount") {
		throw new Error("refusing to switch to unified: the account is already unifiedAccount, so an earlier run never left it. The next run's start leaves it first.");
	}
	const activity = describeActivity(await scanAccount(h));
	if (activity.length > 0) {
		throw new Error(
			`refusing to switch to unified: the principal holds ${activity.join(", ")}, and Hyperliquid will not leave unified until they close. Use a principal no other session trades.`,
		);
	}
	await switchMode();
	const mode = await h.info.userAbstraction({ user: h.user });
	if (mode !== "unifiedAccount") throw new Error(`expected unifiedAccount after the switch, read ${mode}`);
}

export async function usdcTokenId(h: Harness): Promise<string> {
	const usdc = (await h.info.spotMeta()).tokens.find((token) => token.name === DEFAULT_QUOTE_TOKEN);
	if (!usdc) throw new Error(`${DEFAULT_QUOTE_TOKEN} is not a spot token`);
	return formatTokenId(usdc);
}

async function moveUsdc(h: Harness, amount: string, direction: "toSpot" | "toPerp"): Promise<void> {
	await h.principal.sendAsset({
		destination: h.user,
		sourceDex: direction === "toSpot" ? "" : SPOT_DEX,
		destinationDex: direction === "toSpot" ? SPOT_DEX : "",
		token: await usdcTokenId(h),
		amount,
	});
}

export async function restoreUsdcSplit(h: Harness): Promise<void> {
	const gap = toSafeBig(SPOT_FLOAT_USDC).minus(toSafeBig(await spotBalance(h, "USDC"))).round(USDC_DECIMALS, ROUND_DOWN);
	if (gap.lte(0)) {
		if (gap.abs().gte(SPLIT_TOLERANCE_USDC)) await moveUsdc(h, gap.abs().toFixed(), "toPerp");
		return;
	}
	const perp = toSafeBig((await h.info.clearinghouseState({ user: h.user })).withdrawable);
	const topUp = (gap.lt(perp) ? gap : perp).round(USDC_DECIMALS, ROUND_DOWN);
	if (topUp.gte(SPLIT_TOLERANCE_USDC)) await moveUsdc(h, topUp.toFixed(), "toSpot");
}

export async function exitUnified(h: Harness): Promise<void> {
	if ((await h.info.userAbstraction({ user: h.user })) === "unifiedAccount") {
		await h.principal.userSetAbstraction({ user: h.user, abstraction: "disabled" });
		const mode = await h.info.userAbstraction({ user: h.user });
		if (mode !== "disabled") throw new Error(`expected disabled after leaving unified, read ${mode}`);
	}
	await restoreUsdcSplit(h);
}

async function returnCollateral(h: Harness, dex: string, unified: boolean): Promise<void> {
	const { withdrawable } = await h.info.clearinghouseState({ user: h.user, dex });
	if (toSafeBig(withdrawable).eq(0)) return;
	await h.principal.sendAsset({
		destination: h.user,
		sourceDex: dex,
		destinationDex: unified ? SPOT_DEX : "",
		token: await usdcTokenId(h),
		amount: withdrawable,
	});
}

export async function recoverAccount(h: Harness, known: VenueSpec[]): Promise<void> {
	const unified = (await h.info.userAbstraction({ user: h.user })) === "unifiedAccount";
	const scan = unified ? await scanAccount(h) : null;
	const venues = uniqueVenues([...known, ...(scan ? scannedVenues(scan) : [])]);
	const failures: string[] = [];
	for (const venue of venues) {
		await cleanVenue(h, venue).catch((error: unknown) => failures.push(errorMessage(error)));
	}
	const builderDexes = new Set([...venues.map((venue) => venue.dex).filter(isBuilderDex), ...(scan?.collateralDexes ?? [])]);
	for (const dex of builderDexes) {
		await returnCollateral(h, dex, unified).catch((error: unknown) => failures.push(`returning ${dex} collateral: ${errorMessage(error)}`));
	}
	if (failures.length > 0) throw new Error(failures.join("; "));
	await exitUnified(h);
}
