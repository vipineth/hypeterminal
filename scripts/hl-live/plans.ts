import { formatPrice } from "@nktkas/hyperliquid/utils";
import type { LimitTif } from "@/config/trade";
import type { MarketKind } from "@/domain/market/types";
import { buildOrderPlan, type EntryOrderIntent, type OrderIntent, type OrderPlan } from "@/domain/trade/order-intent";
import type { EntryOrderParams } from "@/domain/trade/orders";
import { buildTwapPlan, type TwapPlan } from "@/domain/trade/twap";
import { toSafeBig } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";
import { priceStep, priceWithin, sizeForNotional } from "./assert";

export interface PlanMarket {
	assetId: number;
	szDecimals: number;
	kind: MarketKind;
	markPx: string;
}

export const ORDER_NOTIONAL = 15;
export const TWAP_NOTIONAL = 120;
export const TWAP_MINUTES = 5;
export const SLIPPAGE_BPS = 250;
const CAP_SLACK_BPS = 10;

export function lotSize(market: PlanMarket, notional = ORDER_NOTIONAL): string {
	return sizeForNotional(market.markPx, market.szDecimals, notional, market.kind !== "spot");
}

export const SCALE_LEVELS = 3;

export function scaleTotal(market: PlanMarket): string {
	return toSafeBig(lotSize(market)).times(SCALE_LEVELS).toFixed();
}

export function priceAt(market: PlanMarket, factor: number): string {
	return toSafeBig(market.markPx).times(factor).toString();
}

export function tickPrice(market: PlanMarket, factor: number): string {
	return formatPrice(priceAt(market, factor), market.szDecimals, market.kind === "spot" ? "spot" : "perp");
}

function entry(market: PlanMarket, params: Partial<EntryOrderParams>): EntryOrderIntent {
	return {
		kind: "entry",
		assetId: market.assetId,
		side: "buy",
		orderType: "market",
		sizeValue: Number(lotSize(market)),
		szDecimals: market.szDecimals,
		marketKind: market.kind,
		markPx: Number(market.markPx),
		slippageBps: SLIPPAGE_BPS,
		reduceOnly: false,
		tif: "Gtc",
		limitPriceInput: "",
		triggerPriceInput: "",
		scaleStartPriceInput: "",
		scaleEndPriceInput: "",
		scaleLevelsNum: null,
		tpSlEnabled: false,
		canUseTpSl: market.kind !== "spot",
		tpPriceInput: "",
		slPriceInput: "",
		...params,
	};
}

export const intents = {
	market: (market: PlanMarket, side: Side, size: string, reduceOnly = false): OrderIntent =>
		entry(market, { side, sizeValue: Number(size), reduceOnly }),
	limit: (market: PlanMarket, side: Side, size: string, price: string, tif: LimitTif = "Gtc"): OrderIntent =>
		entry(market, { side, orderType: "limit", sizeValue: Number(size), limitPriceInput: price, tif }),
	marketWithTpSl: (market: PlanMarket, size: string, tpPrice: string, slPrice: string): OrderIntent =>
		entry(market, { sizeValue: Number(size), tpSlEnabled: true, tpPriceInput: tpPrice, slPriceInput: slPrice }),
	scale: (market: PlanMarket, totalSize: string, startPrice: string, endPrice: string, levels: number): OrderIntent =>
		entry(market, {
			orderType: "scale",
			sizeValue: Number(totalSize),
			scaleStartPriceInput: startPrice,
			scaleEndPriceInput: endPrice,
			scaleLevelsNum: levels,
		}),
	positionTpSl: (market: PlanMarket, isLong: boolean, tpPrice: string, slPrice: string): OrderIntent => ({
		kind: "positionTpsl",
		assetId: market.assetId,
		szDecimals: market.szDecimals,
		isLong,
		tpPriceInput: tpPrice,
		slPriceInput: slPrice,
	}),
	close: (market: PlanMarket, size: string, isLong: boolean): OrderIntent => ({
		kind: "marketClose",
		assetId: market.assetId,
		size: Number(size),
		szDecimals: market.szDecimals,
		isLong,
		markPx: Number(market.markPx),
		slippageBps: SLIPPAGE_BPS,
	}),
	reverse: (market: PlanMarket, size: string, isLong: boolean): OrderIntent => ({
		kind: "reverse",
		assetId: market.assetId,
		size: Number(size),
		szDecimals: market.szDecimals,
		isLong,
		markPx: Number(market.markPx),
		slippageBps: SLIPPAGE_BPS,
	}),
	swap: (market: PlanMarket, isBuy: boolean, size: string): OrderIntent => ({
		kind: "swap",
		assetId: market.assetId,
		isBuy,
		sizeValue: Number(size),
		szDecimals: market.szDecimals,
		markPx: Number(market.markPx),
		slippageBps: SLIPPAGE_BPS,
	}),
};

export function twapPlan(market: PlanMarket, side: Side, size: string): TwapPlan {
	return buildTwapPlan({
		assetId: market.assetId,
		side,
		sizeValue: Number(size),
		szDecimals: market.szDecimals,
		reduceOnly: false,
		minutes: TWAP_MINUTES,
		randomize: false,
	});
}

function marketMark(intent: OrderIntent): number | null {
	if (intent.kind === "entry") return intent.orderType === "market" ? intent.markPx : null;
	if (intent.kind === "marketClose" || intent.kind === "reverse" || intent.kind === "swap") return intent.markPx;
	return null;
}

export function marketOrderProblems(intent: OrderIntent, built: OrderPlan): string[] {
	const markPx = marketMark(intent);
	if (markPx === null) return [];
	const kind = intent.kind === "swap" || (intent.kind === "entry" && intent.marketKind === "spot") ? "spot" : "perp";
	return built.orders.flatMap((order) => {
		if (!("limit" in order.t)) return [];
		const problems = order.t.limit.tif === "FrontendMarket" ? [] : [`market order sent as ${order.t.limit.tif}, not FrontendMarket`];
		const band = toSafeBig(SLIPPAGE_BPS).div(10_000);
		const target = toSafeBig(markPx).times(order.b ? band.plus(1) : toSafeBig(1).minus(band));
		const step = priceStep(target, intent.szDecimals, kind);
		if (priceWithin(order.p, target, step, CAP_SLACK_BPS)) return problems;
		return [...problems, `${order.b ? "buy" : "sell"} cap ${order.p} is not mark ${markPx} ${order.b ? "+" : "-"} ${SLIPPAGE_BPS} bps (${target.toFixed()})`];
	});
}

export function plan(intent: OrderIntent): OrderPlan {
	const built = buildOrderPlan(intent);
	if (built.errors.length > 0) throw new Error(`the app refused to build the plan: ${built.errors.join(", ")}`);
	const problems = marketOrderProblems(intent, built);
	if (problems.length > 0) throw new Error(problems.join("; "));
	return built;
}

export function readonlyPlans(market: PlanMarket): { label: string; intent: OrderIntent; plan: OrderPlan }[] {
	const size = lotSize(market);
	const below = priceAt(market, 0.9);
	const above = priceAt(market, 1.1);
	const cases: [string, OrderIntent][] =
		market.kind === "spot"
			? [
					["spot buy", intents.swap(market, true, size)],
					["spot sell", intents.swap(market, false, size)],
				]
			: [
					["market", intents.market(market, "buy", size)],
					["limit", intents.limit(market, "buy", size, below)],
					["post-only", intents.limit(market, "buy", size, below, "Alo")],
					["ioc", intents.limit(market, "sell", size, below, "Ioc")],
					["reduce-only", intents.market(market, "sell", size, true)],
					["tpsl normalTpsl", intents.marketWithTpSl(market, size, above, below)],
					["tpsl positionTpsl", intents.positionTpSl(market, true, above, below)],
					["scale", intents.scale(market, scaleTotal(market), below, priceAt(market, 0.95), SCALE_LEVELS)],
					["close", intents.close(market, size, true)],
					["reverse", intents.reverse(market, size, true)],
				];
	return cases.map(([label, intent]) => ({ label, intent, plan: buildOrderPlan(intent) }));
}
