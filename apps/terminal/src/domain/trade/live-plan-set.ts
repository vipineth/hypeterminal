import type { MetaResponse, PerpDexsResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import Big from "big.js";
import type { ExchangeOrder } from "@/config/trade";
import type { MarketKind } from "@/domain/market";
import type { EntryOrderIntent, OrderIntent, OrderPlan } from "@/domain/trade/order-intent";
import type { TwapIntent, TwapPlan } from "@/domain/trade/twap";
import { getBuilderPerpAssetId, getPerpAssetId, getSpotAssetId } from "@/lib/hyperliquid/markets/helper";
import type { Side } from "@/lib/trade/types";

export interface LiveMetaSnapshot {
	fetchedAt: string;
	perpDexs: PerpDexsResponse;
	allPerpMetas: MetaResponse[];
	perpMarkPxs: string[][];
	spotMeta: SpotMetaResponse;
	spotMarkPxs: string[];
}

export interface LiveMarket {
	name: string;
	assetId: number;
	szDecimals: number;
	kind: MarketKind;
	markPx: Big;
}

type Rounding = "up" | "down";

interface PriceSpec {
	ref: Big;
	rounding: Rounding;
}

type LegKind = { tif: string } | { tpsl: "tp" | "sl"; isMarket: boolean; trigger: PriceSpec };

interface LegSpec {
	side: Side;
	size: string | null;
	reduceOnly: boolean;
	price: PriceSpec;
	kind: LegKind;
}

interface ScaleSpec {
	totalSize: string;
	start: Big;
	end: Big;
}

interface PlanSpec {
	grouping: OrderPlan["grouping"];
	legs: LegSpec[];
	scale?: ScaleSpec;
}

export interface PlanCase {
	label: string;
	market: LiveMarket;
	side: Side;
	intent: OrderIntent;
	expected: PlanSpec | "rejected";
}

export interface TwapCase {
	market: LiveMarket;
	intent: TwapIntent;
}

const PERP_PRICE_DECIMALS = 6;
const SPOT_PRICE_DECIMALS = 8;
const PRICE_SIG_FIGS = 5;
const SLIPPAGE_BPS = 250;
const SWAP_SLIPPAGE_BPS = 100;
const MIN_CASE_NOTIONAL = 200;
const SCALE_LEVEL_COUNTS = [3, 4, 5, 7, 10, 20];

export function listLiveMarkets(snapshot: LiveMetaSnapshot): LiveMarket[] {
	const markets: LiveMarket[] = [];

	snapshot.allPerpMetas.forEach((meta, dexIndex) => {
		meta.universe.forEach((asset, assetIndex) => {
			const markPx = Big(snapshot.perpMarkPxs[dexIndex]?.[assetIndex] ?? 0);
			if (asset.isDelisted || markPx.lte(0)) return;
			markets.push({
				name: asset.name,
				assetId: dexIndex === 0 ? getPerpAssetId(assetIndex) : getBuilderPerpAssetId(dexIndex, assetIndex),
				szDecimals: asset.szDecimals,
				kind: dexIndex === 0 ? "perp" : "builderPerp",
				markPx,
			});
		});
	});

	const tokenByIndex = new Map(snapshot.spotMeta.tokens.map((token) => [token.index, token]));
	for (const pair of snapshot.spotMeta.universe) {
		const base = tokenByIndex.get(pair.tokens[0]);
		const markPx = Big(snapshot.spotMarkPxs[pair.index] ?? 0);
		if (!base || !tokenByIndex.has(pair.tokens[1]) || markPx.lte(0)) continue;
		markets.push({
			name: pair.name,
			assetId: getSpotAssetId(pair.index),
			szDecimals: base.szDecimals,
			kind: "spot",
			markPx,
		});
	}

	return markets;
}

export function buildLiveCases(snapshot: LiveMetaSnapshot): PlanCase[] {
	return listLiveMarkets(snapshot).flatMap((market) =>
		(["buy", "sell"] as const).flatMap((side) =>
			market.kind === "spot" ? spotCases(market, side) : perpCases(market, side),
		),
	);
}

export function buildTwapCases(snapshot: LiveMetaSnapshot): TwapCase[] {
	return listLiveMarkets(snapshot).flatMap((market) =>
		(["buy", "sell"] as const).map((side) => ({
			market,
			intent: {
				assetId: market.assetId,
				side,
				sizeValue: caseSize(market).toNumber(),
				szDecimals: market.szDecimals,
				reduceOnly: side === "sell",
				minutes: 30,
				randomize: false,
			},
		})),
	);
}

function opposite(side: Side): Side {
	return side === "buy" ? "sell" : "buy";
}

function passive(side: Side): Rounding {
	return side === "buy" ? "down" : "up";
}

function aggressive(side: Side): Rounding {
	return side === "buy" ? "up" : "down";
}

function scaled(price: Big, factor: string): Big {
	return Big(price.times(factor).toPrecision(12));
}

function caseSize(market: LiveMarket): Big {
	let size = Big(10).pow(-market.szDecimals);
	while (size.times(market.markPx).lt(MIN_CASE_NOTIONAL)) size = size.times(10);
	return size;
}

function slipped(market: LiveMarket, side: Side, bps: number): Big {
	const move = Big(bps).div(10000);
	return market.markPx.times(side === "buy" ? Big(1).plus(move) : Big(1).minus(move));
}

function entry(market: LiveMarket, side: Side, size: Big, fields: Partial<EntryOrderIntent>): EntryOrderIntent {
	return {
		kind: "entry",
		assetId: market.assetId,
		side,
		orderType: "market",
		sizeValue: size.toNumber(),
		szDecimals: market.szDecimals,
		marketKind: market.kind,
		markPx: market.markPx.toNumber(),
		slippageBps: SLIPPAGE_BPS,
		reduceOnly: false,
		tif: "Gtc",
		limitPriceInput: "",
		triggerPriceInput: "",
		scaleStartPriceInput: "",
		scaleEndPriceInput: "",
		scaleLevelsNum: null,
		tpSlEnabled: false,
		canUseTpSl: false,
		tpPriceInput: "",
		slPriceInput: "",
		...fields,
	};
}

function marketLeg(market: LiveMarket, side: Side, size: string, reduceOnly: boolean): LegSpec {
	return {
		side,
		size,
		reduceOnly,
		price: { ref: slipped(market, side, SLIPPAGE_BPS), rounding: aggressive(side) },
		kind: { tif: "FrontendMarket" },
	};
}

function limitLeg(side: Side, size: string | null, reduceOnly: boolean, price: Big): LegSpec {
	return { side, size, reduceOnly, price: { ref: price, rounding: passive(side) }, kind: { tif: "Gtc" } };
}

function triggerLeg(side: Side, size: string, tpsl: "tp" | "sl", trigger: Big, limit?: Big): LegSpec {
	const triggerSpec = { ref: trigger, rounding: passive(side) };
	return {
		side,
		size,
		reduceOnly: true,
		price: limit ? { ref: limit, rounding: passive(side) } : triggerSpec,
		kind: { tpsl, isMarket: !limit, trigger: triggerSpec },
	};
}

function single(leg: LegSpec): PlanSpec {
	return { grouping: "na", legs: [leg] };
}

function scaleCase(market: LiveMarket, side: Side, size: Big, levels: number, descending: boolean): PlanCase {
	const lot = Big(10).pow(-market.szDecimals);
	const total = size.times(levels).plus(lot.times(levels - 1));
	const low = ceilToTick(scaled(market.markPx, side === "buy" ? "0.95" : "1.01"), market);
	const high = ceilToTick(scaled(market.markPx, side === "buy" ? "0.99" : "1.05"), market);
	const [start, end] = descending ? [high, low] : [low, high];
	const span = end.minus(start);
	return {
		label: `${market.kind === "spot" ? "spot" : "perp"} scale ${levels} legs ${descending ? "down" : "up"}`,
		market,
		side,
		intent: entry(market, side, total, {
			orderType: "scale",
			scaleStartPriceInput: start.toFixed(),
			scaleEndPriceInput: end.toFixed(),
			scaleLevelsNum: levels,
		}),
		expected: {
			grouping: "na",
			scale: { totalSize: total.toFixed(), start, end },
			legs: Array.from({ length: levels }, (_, i) =>
				limitLeg(side, null, false, start.plus(span.times(i).div(levels - 1))),
			),
		},
	};
}

function scaleCases(market: LiveMarket, side: Side, size: Big): PlanCase[] {
	return SCALE_LEVEL_COUNTS.flatMap((levels) => [
		scaleCase(market, side, size, levels, false),
		scaleCase(market, side, size, levels, true),
	]);
}

function perpCases(market: LiveMarket, side: Side): PlanCase[] {
	const size = caseSize(market);
	const sz = size.toFixed();
	const isBuy = side === "buy";
	const exit = opposite(side);
	const limit = scaled(market.markPx, isBuy ? "0.9712345" : "1.0312345");
	const stopTrigger = scaled(market.markPx, isBuy ? "1.0512345" : "0.9512345");
	const takeTrigger = scaled(market.markPx, isBuy ? "0.9512345" : "1.0512345");
	const stopLimit = scaled(stopTrigger, isBuy ? "1.0112345" : "0.9912345");
	const takeLimit = scaled(takeTrigger, isBuy ? "0.9912345" : "1.0112345");
	const entryTp = scaled(market.markPx, isBuy ? "1.1012345" : "0.9012345");
	const entrySl = scaled(market.markPx, isBuy ? "0.9012345" : "1.1012345");
	const closeLimit = scaled(market.markPx, isBuy ? "0.9812345" : "1.0212345");
	const isLong = !isBuy;
	const position = { assetId: market.assetId, szDecimals: market.szDecimals, isLong };
	const perpCase = (label: string, intent: OrderIntent, expected: PlanCase["expected"]): PlanCase => ({
		label: `perp ${label}`,
		market,
		side,
		intent,
		expected,
	});

	return [
		perpCase("market", entry(market, side, size, {}), single(marketLeg(market, side, sz, false))),
		perpCase(
			"limit",
			entry(market, side, size, { orderType: "limit", limitPriceInput: limit.toFixed() }),
			single(limitLeg(side, sz, false, limit)),
		),
		perpCase(
			"market with TP/SL",
			entry(market, side, size, {
				tpSlEnabled: true,
				canUseTpSl: true,
				tpPriceInput: entryTp.toFixed(),
				slPriceInput: entrySl.toFixed(),
			}),
			{
				grouping: "normalTpsl",
				legs: [
					marketLeg(market, side, sz, false),
					triggerLeg(exit, sz, "tp", entryTp),
					triggerLeg(exit, sz, "sl", entrySl),
				],
			},
		),
		perpCase(
			"stop market",
			entry(market, side, size, { orderType: "stopMarket", triggerPriceInput: stopTrigger.toFixed() }),
			single(triggerLeg(side, sz, "sl", stopTrigger)),
		),
		perpCase(
			"stop limit",
			entry(market, side, size, {
				orderType: "stopLimit",
				triggerPriceInput: stopTrigger.toFixed(),
				limitPriceInput: stopLimit.toFixed(),
			}),
			single(triggerLeg(side, sz, "sl", stopTrigger, stopLimit)),
		),
		perpCase(
			"take profit market",
			entry(market, side, size, { orderType: "takeProfitMarket", triggerPriceInput: takeTrigger.toFixed() }),
			single(triggerLeg(side, sz, "tp", takeTrigger)),
		),
		perpCase(
			"take profit limit",
			entry(market, side, size, {
				orderType: "takeProfitLimit",
				triggerPriceInput: takeTrigger.toFixed(),
				limitPriceInput: takeLimit.toFixed(),
			}),
			single(triggerLeg(side, sz, "tp", takeTrigger, takeLimit)),
		),
		...scaleCases(market, side, size),
		perpCase(
			"market close",
			{
				kind: "marketClose",
				...position,
				size: size.toNumber(),
				markPx: market.markPx.toNumber(),
				slippageBps: SLIPPAGE_BPS,
			},
			single(marketLeg(market, side, sz, true)),
		),
		perpCase(
			"limit close",
			{ kind: "limitClose", ...position, size: size.toNumber(), price: closeLimit.toNumber() },
			single(limitLeg(side, sz, true, closeLimit)),
		),
		perpCase(
			"reverse",
			{
				kind: "reverse",
				...position,
				size: size.toNumber(),
				markPx: market.markPx.toNumber(),
				slippageBps: SLIPPAGE_BPS,
			},
			single(marketLeg(market, side, size.times(2).toFixed(), false)),
		),
		perpCase(
			"position TP/SL",
			{
				kind: "positionTpsl",
				...position,
				tpPriceNum: closeTp(market, side).toNumber(),
				slPriceNum: closeSl(market, side).toNumber(),
			},
			{
				grouping: "positionTpsl",
				legs: [triggerLeg(side, "0", "tp", closeTp(market, side)), triggerLeg(side, "0", "sl", closeSl(market, side))],
			},
		),
		perpCase("twap", entry(market, side, size, { orderType: "twap" }), "rejected"),
	];
}

function closeTp(market: LiveMarket, side: Side): Big {
	return scaled(market.markPx, side === "sell" ? "1.1012345" : "0.9012345");
}

function closeSl(market: LiveMarket, side: Side): Big {
	return scaled(market.markPx, side === "sell" ? "0.9012345" : "1.1012345");
}

function spotCases(market: LiveMarket, side: Side): PlanCase[] {
	const size = caseSize(market);
	const sz = size.toFixed();
	const limit = scaled(market.markPx, side === "buy" ? "0.9712345" : "1.0312345");
	const swapMultiplier = Big(1).plus(Big(SWAP_SLIPPAGE_BPS).div(10000));
	const swapRef = side === "buy" ? market.markPx.times(swapMultiplier) : market.markPx.div(swapMultiplier);
	const spotCase = (label: string, intent: OrderIntent, expected: PlanCase["expected"]): PlanCase => ({
		label: `spot ${label}`,
		market,
		side,
		intent,
		expected,
	});

	return [
		spotCase("market", entry(market, side, size, {}), single(marketLeg(market, side, sz, false))),
		spotCase(
			"limit",
			entry(market, side, size, { orderType: "limit", limitPriceInput: limit.toFixed() }),
			single(limitLeg(side, sz, false, limit)),
		),
		...scaleCases(market, side, size),
		spotCase(
			"swap",
			{
				kind: "swap",
				assetId: market.assetId,
				isBuy: side === "buy",
				sizeValue: size.toNumber(),
				szDecimals: market.szDecimals,
				markPx: market.markPx.toNumber(),
				slippageBps: SWAP_SLIPPAGE_BPS,
			},
			single({
				side,
				size: sz,
				reduceOnly: false,
				price: { ref: swapRef, rounding: aggressive(side) },
				kind: { tif: "FrontendMarket" },
			}),
		),
		spotCase("twap", entry(market, side, size, { orderType: "twap" }), "rejected"),
	];
}

function decimalsOf(value: string): number {
	const dot = value.indexOf(".");
	return dot === -1 ? 0 : value.length - dot - 1;
}

function significantFigures(value: string): number {
	return value.replace("-", "").replace(".", "").replace(/^0+/, "").length;
}

function isCanonical(value: string): boolean {
	return /^\d+(\.\d*[1-9])?$/.test(value) && Big(value).toFixed() === value;
}

function checkSize(size: string, szDecimals: number): string[] {
	if (!isCanonical(size)) return [`size ${JSON.stringify(size)} is not a canonical decimal`];
	const problems: string[] = [];
	if (Big(size).lte(0)) problems.push(`size ${size} is not positive`);
	if (decimalsOf(size) > szDecimals) problems.push(`size ${size} has more than ${szDecimals} decimals`);
	return problems;
}

function maxPriceDecimals(market: LiveMarket): number {
	return Math.max((market.kind === "spot" ? SPOT_PRICE_DECIMALS : PERP_PRICE_DECIMALS) - market.szDecimals, 0);
}

function priceTick(price: Big, market: LiveMarket): Big {
	return Big(10).pow(Math.max(price.e - (PRICE_SIG_FIGS - 1), -maxPriceDecimals(market)));
}

function ceilToTick(price: Big, market: LiveMarket): Big {
	const tick = priceTick(price, market);
	return price.div(tick).round(0, Big.roundUp).times(tick);
}

function isRepresentable(spec: PriceSpec, market: LiveMarket): boolean {
	return spec.rounding === "up" || spec.ref.gte(Big(10).pow(-maxPriceDecimals(market)));
}

function hasUnrepresentablePrice(legs: LegSpec[], market: LiveMarket): boolean {
	return legs.some(
		(leg) =>
			!isRepresentable(leg.price, market) || ("trigger" in leg.kind && !isRepresentable(leg.kind.trigger, market)),
	);
}

function checkPrice(label: string, price: string, spec: PriceSpec, market: LiveMarket): string[] {
	if (!isCanonical(price)) return [`${label} ${JSON.stringify(price)} is not a canonical decimal`];
	const maxDecimals = maxPriceDecimals(market);
	const value = Big(price);
	const diff = value.minus(spec.ref);
	const tick = priceTick(spec.ref, market);
	const problems: string[] = [];
	if (value.lte(0)) problems.push(`${label} ${price} is not positive`);
	if (decimalsOf(price) > maxDecimals) problems.push(`${label} ${price} has more than ${maxDecimals} decimals`);
	if (price.includes(".") && significantFigures(price) > PRICE_SIG_FIGS) {
		problems.push(`${label} ${price} has more than ${PRICE_SIG_FIGS} significant figures`);
	}
	if (spec.rounding === "up" ? diff.lt(0) : diff.gt(0)) {
		problems.push(`${label} ${price} rounds ${spec.rounding === "up" ? "below" : "above"} ${spec.ref.toFixed()}`);
	}
	if (diff.abs().gte(tick)) problems.push(`${label} ${price} is a tick or more from ${spec.ref.toFixed()}`);
	if (spec.ref.mod(tick).eq(0) && !diff.eq(0)) {
		problems.push(`${label} ${price} moved the valid price ${spec.ref.toFixed()}`);
	}
	return problems;
}

function checkKind(order: ExchangeOrder, kind: LegKind, market: LiveMarket): string[] {
	if ("tif" in kind) {
		if (!("limit" in order.t) || order.t.limit.tif !== kind.tif)
			return [`expected limit ${kind.tif}, got ${JSON.stringify(order.t)}`];
		return [];
	}
	if (!("trigger" in order.t)) return [`expected a ${kind.tpsl} trigger, got ${JSON.stringify(order.t)}`];
	const { trigger } = order.t;
	const problems = checkPrice("triggerPx", String(trigger.triggerPx), kind.trigger, market);
	if (trigger.tpsl !== kind.tpsl) problems.push(`tpsl ${trigger.tpsl} != ${kind.tpsl}`);
	if (trigger.isMarket !== kind.isMarket) problems.push(`isMarket ${trigger.isMarket} != ${kind.isMarket}`);
	return problems;
}

function checkLeg(order: ExchangeOrder, leg: LegSpec, market: LiveMarket): string[] {
	const problems: string[] = [];
	if (order.a !== market.assetId) problems.push(`asset ${order.a} != ${market.assetId}`);
	if (order.b !== (leg.side === "buy")) problems.push(`side ${order.b ? "buy" : "sell"} != ${leg.side}`);
	if (order.r !== leg.reduceOnly) problems.push(`reduceOnly ${order.r} != ${leg.reduceOnly}`);
	if (leg.size === "0") {
		if (order.s !== "0") problems.push(`size ${order.s} != 0`);
	} else {
		problems.push(...checkSize(order.s, market.szDecimals));
		if (leg.size !== null && order.s !== leg.size) problems.push(`size ${order.s} != ${leg.size}`);
	}
	problems.push(...checkPrice("price", order.p, leg.price, market));
	problems.push(...checkKind(order, leg.kind, market));
	return problems;
}

function checkScale(orders: ExchangeOrder[], scale: ScaleSpec, side: Side, market: LiveMarket): string[] {
	const { totalSize } = scale;
	const lots = Big(10).pow(market.szDecimals);
	const totalLots = Big(totalSize).times(lots);
	const baseLots = totalLots.div(orders.length).round(0, Big.roundDown);
	const sum = orders.reduce((total, order) => total.plus(order.s), Big(0));
	const problems: string[] = [];
	if (!sum.eq(totalSize)) problems.push(`scale legs sum to ${sum.toFixed()}, requested ${totalSize}`);
	for (const order of orders) {
		const legLots = Big(order.s).times(lots);
		if (legLots.lt(baseLots) || legLots.gt(baseLots.plus(1))) {
			problems.push(`scale leg ${order.s} is more than one lot from an even split of ${totalSize}`);
		}
	}
	const midNotional = Big(totalSize).times(scale.start.plus(scale.end).div(2));
	const wireNotional = orders.reduce((total, order) => total.plus(Big(order.s).times(order.p)), Big(0));
	if (side === "buy" && wireNotional.gt(midNotional)) {
		problems.push(`scale buy sends ${wireNotional.toFixed()}, more than size times mid ${midNotional.toFixed()}`);
	}
	return problems;
}

export function checkCase(planCase: PlanCase, plan: OrderPlan): string[] {
	const where = `${planCase.label} ${planCase.side} ${planCase.market.name} (sz ${planCase.market.szDecimals})`;
	const { expected, market } = planCase;

	if (expected === "rejected" || hasUnrepresentablePrice(expected.legs, market)) {
		if (plan.orders.length === 0 && plan.errors.length > 0) return [];
		return [`${where}: expected the plan to be rejected, got ${JSON.stringify(plan.orders)}`];
	}
	if (plan.errors.length > 0) return [`${where}: unexpected errors ${plan.errors.join("; ")}`];
	if (plan.grouping !== expected.grouping) return [`${where}: grouping ${plan.grouping} != ${expected.grouping}`];
	if (plan.orders.length !== expected.legs.length) {
		return [`${where}: ${plan.orders.length} legs, expected ${expected.legs.length}`];
	}

	const problems = plan.orders.flatMap((order, i) =>
		checkLeg(order, expected.legs[i], market).map((problem) => `${where} leg ${i}: ${problem}`),
	);
	if (expected.scale) {
		problems.push(...checkScale(plan.orders, expected.scale, planCase.side, market).map((p) => `${where}: ${p}`));
	}
	return problems;
}

export function checkTwapCase({ market, intent }: TwapCase, plan: TwapPlan): string[] {
	const where = `twap ${intent.side} ${market.name} (sz ${market.szDecimals})`;
	if (!plan.action) return [`${where}: unexpected errors ${plan.errors.join("; ")}`];
	const { twap } = plan.action;
	const size = caseSize(market).toFixed();
	const problems = checkSize(twap.s, market.szDecimals);
	if (twap.s !== size) problems.push(`size ${twap.s} != ${size}`);
	if (twap.a !== market.assetId) problems.push(`asset ${twap.a} != ${market.assetId}`);
	if (twap.b !== (intent.side === "buy")) problems.push(`side ${twap.b ? "buy" : "sell"} != ${intent.side}`);
	if (twap.r !== intent.reduceOnly) problems.push(`reduceOnly ${twap.r} != ${intent.reduceOnly}`);
	if (twap.m !== intent.minutes) problems.push(`minutes ${twap.m} != ${intent.minutes}`);
	return problems.map((problem) => `${where}: ${problem}`);
}
