import type { LimitTif } from "@/config/trade";
import type { MarketKind } from "@/domain/market/types";
import { buildOrderPlan, type EntryOrderIntent, type OrderIntent, type OrderPlan } from "@/domain/trade/order-intent";
import type { EntryOrderParams } from "@/domain/trade/orders";
import { buildTwapPlan, type TwapPlan } from "@/domain/trade/twap";
import { toSafeBig } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";
import { sizeForNotional } from "./assert";

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

export function plan(intent: OrderIntent): OrderPlan {
	const built = buildOrderPlan(intent);
	if (built.errors.length > 0) throw new Error(`the app refused to build the plan: ${built.errors.join(", ")}`);
	return built;
}

export function readonlyPlans(market: PlanMarket): { label: string; plan: OrderPlan }[] {
	const size = lotSize(market);
	if (market.kind === "spot") {
		return [
			{ label: "spot buy", plan: buildOrderPlan(intents.swap(market, true, size)) },
			{ label: "spot sell", plan: buildOrderPlan(intents.swap(market, false, size)) },
		];
	}
	const below = priceAt(market, 0.9);
	const above = priceAt(market, 1.1);
	return [
		{ label: "market", plan: buildOrderPlan(intents.market(market, "buy", size)) },
		{ label: "limit", plan: buildOrderPlan(intents.limit(market, "buy", size, below)) },
		{ label: "post-only", plan: buildOrderPlan(intents.limit(market, "buy", size, below, "Alo")) },
		{ label: "ioc", plan: buildOrderPlan(intents.limit(market, "sell", size, below, "Ioc")) },
		{ label: "reduce-only", plan: buildOrderPlan(intents.market(market, "sell", size, true)) },
		{ label: "tpsl normalTpsl", plan: buildOrderPlan(intents.marketWithTpSl(market, size, above, below)) },
		{ label: "tpsl positionTpsl", plan: buildOrderPlan(intents.positionTpSl(market, true, above, below)) },
		{ label: "scale", plan: buildOrderPlan(intents.scale(market, scaleTotal(market), below, priceAt(market, 0.95), SCALE_LEVELS)) },
		{ label: "close", plan: buildOrderPlan(intents.close(market, size, true)) },
		{ label: "reverse", plan: buildOrderPlan(intents.reverse(market, size, true)) },
	];
}
