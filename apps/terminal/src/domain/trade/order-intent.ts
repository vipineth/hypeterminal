import Big from "big.js";
import type { ExchangeOrder } from "@/config/trade";
import type { ListedMarket, PerpLikeMarket, SpotMarket } from "@/domain/market/model";
import { getMarketPrice } from "@/domain/trade/order/price";
import {
	buildOrders,
	type EntryOrderParams,
	formatPriceForOrder,
	formatSizeForOrder,
	formatTriggerPxForOrder,
	isBelowMinNotional,
	ORDER_PLAN_ERRORS,
	OrderBuildError,
	type OrderPlanError,
	type SizeWire,
	type TpSl,
	type WireOrder,
} from "@/domain/trade/orders";
import { toSafeBig } from "@/lib/trade/numbers";
import { isTwapOrderType } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

export type OrderPlan = {
	orders: ExchangeOrder[];
	grouping: "na" | "normalTpsl" | "positionTpsl";
	errors: OrderPlanError[];
	warnings: string[];
};

export type EntryOrderIntent = EntryOrderParams & { kind: "entry" };

export type PositionTpSlIntent = {
	kind: "positionTpsl";
	market: PerpLikeMarket;
	isLong: boolean;
	tpPriceInput: string | null;
	slPriceInput: string | null;
};

export type MarketCloseIntent = {
	kind: "marketClose";
	market: PerpLikeMarket;
	size: string;
	isLong: boolean;
	markPx: string;
	slippageBps: number;
};

export type LimitCloseIntent = {
	kind: "limitClose";
	market: PerpLikeMarket;
	size: string;
	isLong: boolean;
	price: string;
};

export type ReverseIntent = {
	kind: "reverse";
	market: PerpLikeMarket & ListedMarket;
	size: string;
	isLong: boolean;
	markPx: string;
	slippageBps: number;
};

export type SwapIntent = {
	kind: "swap";
	market: SpotMarket;
	isBuy: boolean;
	sizeValue: string;
	markPx: string;
	slippageBps: number;
};

export type OrderIntent =
	| EntryOrderIntent
	| PositionTpSlIntent
	| MarketCloseIntent
	| LimitCloseIntent
	| ReverseIntent
	| SwapIntent;

type PlanLegs = { orders: WireOrder[]; grouping: OrderPlan["grouping"] };

export type PlanLegRole = "entry" | "takeProfit" | "stopLoss" | "order" | "scaleLeg";

export type PlanLeg = { role: PlanLegRole; price: string };

export function describePlanLegs({ orders, grouping }: Pick<OrderPlan, "orders" | "grouping">): PlanLeg[] {
	return orders.map((order, index) => ({ role: getLegRole(order, index, grouping, orders.length), price: order.p }));
}

function getLegRole(
	order: ExchangeOrder,
	index: number,
	grouping: OrderPlan["grouping"],
	legCount: number,
): PlanLegRole {
	if (grouping === "normalTpsl" && index === 0) return "entry";
	if (grouping !== "na" && "trigger" in order.t) return order.t.trigger.tpsl === "tp" ? "takeProfit" : "stopLoss";
	return legCount > 1 ? "scaleLeg" : "order";
}

const PLAN_ID_BYTES = 14;

export function createPlanId(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(PLAN_ID_BYTES));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type CloidOrder = ExchangeOrder & { c: `0x${string}` };

export function assignCloids(orders: ExchangeOrder[], planId: string): CloidOrder[] {
	return orders.map((order, index) => ({ ...order, c: `0x${planId}${index.toString(16).padStart(4, "0")}` }));
}

export function buildOrderPlan(intent: OrderIntent): OrderPlan {
	try {
		const { orders, grouping } = buildPlanLegs(intent);
		if (orders.some(isBelowMinNotional)) return blockedPlan(ORDER_PLAN_ERRORS.belowMinNotional);
		return { orders, grouping, errors: [], warnings: [] };
	} catch (error) {
		if (error instanceof OrderBuildError) return blockedPlan(error.reason);
		throw error;
	}
}

function blockedPlan(reason: OrderPlanError): OrderPlan {
	return { orders: [], grouping: "na", errors: [reason], warnings: [] };
}

function buildPlanLegs(intent: OrderIntent): PlanLegs {
	switch (intent.kind) {
		case "entry":
			return buildEntryPlan(intent);
		case "positionTpsl":
			return buildPositionTpSlPlan(intent);
		case "marketClose":
			return buildMarketClosePlan(intent);
		case "limitClose":
			return buildLimitClosePlan(intent);
		case "reverse":
			return buildReversePlan(intent);
		case "swap":
			return buildSwapPlan(intent);
		default:
			return assertNever(intent);
	}
}

function getCloseSide(isLong: boolean): Side {
	return isLong ? "sell" : "buy";
}

function buildEntryPlan(intent: EntryOrderIntent): PlanLegs {
	if (isTwapOrderType(intent.orderType)) throw new OrderBuildError(ORDER_PLAN_ERRORS.twapNotSupported);
	return buildOrders(intent);
}

function buildPositionTpSlPlan({ market, isLong, tpPriceInput, slPriceInput }: PositionTpSlIntent): PlanLegs {
	const orders: WireOrder[] = [];
	const isBuy = !isLong;

	if (tpPriceInput !== null) {
		orders.push(buildPositionTpSlOrder(market, isBuy, tpPriceInput, "tp"));
	}

	if (slPriceInput !== null) {
		orders.push(buildPositionTpSlOrder(market, isBuy, slPriceInput, "sl"));
	}

	if (orders.length === 0) throw new OrderBuildError(ORDER_PLAN_ERRORS.noTpSl);
	return { orders, grouping: "positionTpsl" };
}

function buildMarketClosePlan({ market, size, isLong, markPx, slippageBps }: MarketCloseIntent): PlanLegs {
	const side = getCloseSide(isLong);
	const orderPrice = getMarketPrice(side, markPx, slippageBps);

	return {
		orders: [
			{
				a: market.assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice, market, side, "aggressive"),
				s: formatSizeForOrder(size, market),
				r: true,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildLimitClosePlan({ market, size, isLong, price }: LimitCloseIntent): PlanLegs {
	const side = getCloseSide(isLong);

	return {
		orders: [
			{
				a: market.assetId,
				b: side === "buy",
				p: formatPriceForOrder(price, market, side, "passive"),
				s: formatSizeForOrder(size, market),
				r: true,
				t: { limit: { tif: "Gtc" } },
			},
		],
		grouping: "na",
	};
}

function buildReversePlan({ market, size, isLong, markPx, slippageBps }: ReverseIntent): PlanLegs {
	const side = getCloseSide(isLong);
	const orderPrice = getMarketPrice(side, markPx, slippageBps);

	return {
		orders: [
			{
				a: market.assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice, market, side, "aggressive"),
				s: formatSizeForOrder(toSafeBig(size).times(2), market),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildSwapPlan({ market, isBuy, sizeValue, markPx, slippageBps }: SwapIntent): PlanLegs {
	const slippageMultiplier = Big(1).plus(Big(slippageBps).div(10000));
	const mark = toSafeBig(markPx);
	const price = isBuy ? mark.times(slippageMultiplier) : mark.div(slippageMultiplier);

	return {
		orders: [
			{
				a: market.assetId,
				b: isBuy,
				p: formatPriceForOrder(price, market, isBuy ? "buy" : "sell", "aggressive"),
				s: formatSizeForOrder(sizeValue, market),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildPositionTpSlOrder(market: PerpLikeMarket, isBuy: boolean, triggerPrice: string, tpsl: TpSl): WireOrder {
	const side = isBuy ? "buy" : "sell";
	return {
		a: market.assetId,
		b: isBuy,
		p: formatPriceForOrder(triggerPrice, market, side, "passive"),
		s: "0" as SizeWire,
		r: true,
		t: { trigger: { isMarket: true, triggerPx: formatTriggerPxForOrder(triggerPrice, market, side, tpsl), tpsl } },
	};
}

function assertNever(value: never): never {
	throw new Error(`Unhandled order intent: ${String(value)}`);
}
