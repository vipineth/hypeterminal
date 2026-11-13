import Big from "big.js";
import type { ExchangeOrder } from "@/config/trade";
import { getMarketPrice } from "@/domain/trade/order/price";
import {
	buildOrders,
	type EntryOrderParams,
	formatPriceForOrder,
	formatSizeForOrder,
	isBelowMinNotional,
	ORDER_PLAN_ERRORS,
	OrderBuildError,
	type OrderPlanError,
	type WireMarket,
} from "@/domain/trade/orders";
import { isPositive, toSafeBig } from "@/lib/trade/numbers";
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
	assetId: number;
	szDecimals: number;
	isLong: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
};

export type MarketCloseIntent = {
	kind: "marketClose";
	assetId: number;
	size: number;
	szDecimals: number;
	isLong: boolean;
	markPx: number;
	slippageBps: number;
};

export type LimitCloseIntent = {
	kind: "limitClose";
	assetId: number;
	size: number;
	szDecimals: number;
	isLong: boolean;
	price: number;
};

export type ReverseIntent = {
	kind: "reverse";
	assetId: number;
	size: number;
	szDecimals: number;
	isLong: boolean;
	markPx: number;
	slippageBps: number;
};

export type SwapIntent = {
	kind: "swap";
	assetId: number;
	isBuy: boolean;
	sizeValue: number;
	szDecimals: number;
	markPx: number;
	slippageBps: number;
};

export type OrderIntent =
	| EntryOrderIntent
	| PositionTpSlIntent
	| MarketCloseIntent
	| LimitCloseIntent
	| ReverseIntent
	| SwapIntent;

type PlanLegs = Pick<OrderPlan, "orders" | "grouping">;

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

function perpMarket(szDecimals: number): WireMarket {
	return { szDecimals, kind: "perp" };
}

function buildEntryPlan(intent: EntryOrderIntent): PlanLegs {
	if (isTwapOrderType(intent.orderType)) throw new OrderBuildError(ORDER_PLAN_ERRORS.twapNotSupported);
	return buildOrders(intent);
}

function buildPositionTpSlPlan(intent: PositionTpSlIntent): PlanLegs {
	const orders: ExchangeOrder[] = [];
	const isBuy = !intent.isLong;
	const market = perpMarket(intent.szDecimals);

	if (intent.tpPriceNum && isPositive(intent.tpPriceNum)) {
		orders.push(buildPositionTpSlOrder(intent.assetId, market, isBuy, intent.tpPriceNum, "tp"));
	}

	if (intent.slPriceNum && isPositive(intent.slPriceNum)) {
		orders.push(buildPositionTpSlOrder(intent.assetId, market, isBuy, intent.slPriceNum, "sl"));
	}

	if (orders.length === 0) throw new OrderBuildError(ORDER_PLAN_ERRORS.noTpSl);
	return { orders, grouping: "positionTpsl" };
}

function buildMarketClosePlan({ assetId, size, szDecimals, isLong, markPx, slippageBps }: MarketCloseIntent): PlanLegs {
	const side = getCloseSide(isLong);
	const orderPrice = getMarketPrice(side, markPx, slippageBps);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice, perpMarket(szDecimals), side, "aggressive"),
				s: formatSizeForOrder(size, szDecimals),
				r: true,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildLimitClosePlan({ assetId, size, szDecimals, isLong, price }: LimitCloseIntent): PlanLegs {
	const side = getCloseSide(isLong);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(price, perpMarket(szDecimals), side, "passive"),
				s: formatSizeForOrder(size, szDecimals),
				r: true,
				t: { limit: { tif: "Gtc" } },
			},
		],
		grouping: "na",
	};
}

function buildReversePlan({ assetId, size, szDecimals, isLong, markPx, slippageBps }: ReverseIntent): PlanLegs {
	const side = getCloseSide(isLong);
	const orderPrice = getMarketPrice(side, markPx, slippageBps);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice, perpMarket(szDecimals), side, "aggressive"),
				s: formatSizeForOrder(Big(size).times(2), szDecimals),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildSwapPlan({ assetId, isBuy, sizeValue, szDecimals, markPx, slippageBps }: SwapIntent): PlanLegs {
	const slippageMultiplier = Big(1).plus(Big(slippageBps).div(10000));
	const mark = toSafeBig(markPx);
	const price = isBuy ? mark.times(slippageMultiplier) : mark.div(slippageMultiplier);

	return {
		orders: [
			{
				a: assetId,
				b: isBuy,
				p: formatPriceForOrder(price, { szDecimals, kind: "spot" }, isBuy ? "buy" : "sell", "aggressive"),
				s: formatSizeForOrder(sizeValue, szDecimals),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
	};
}

function buildPositionTpSlOrder(
	assetId: number,
	market: WireMarket,
	isBuy: boolean,
	triggerPrice: number,
	tpsl: "tp" | "sl",
): ExchangeOrder {
	const triggerPx = formatPriceForOrder(triggerPrice, market, isBuy ? "buy" : "sell", "passive");
	return {
		a: assetId,
		b: isBuy,
		p: triggerPx,
		s: "0",
		r: true,
		t: { trigger: { isMarket: true, triggerPx, tpsl } },
	};
}

function assertNever(value: never): never {
	throw new Error(`Unhandled order intent: ${String(value)}`);
}
