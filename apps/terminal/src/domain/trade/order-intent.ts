import Big from "big.js";
import type { ExchangeOrder } from "@/config/trade";
import { getExecutedPrice } from "@/domain/trade/order/price";
import { buildOrders, type EntryOrderParams, formatPriceForOrder, formatSizeForOrder } from "@/domain/trade/orders";
import { isPositive } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

export type OrderPlan = {
	orders: ExchangeOrder[];
	grouping: "na" | "normalTpsl" | "positionTpsl";
	errors: string[];
	warnings: string[];
};

export type EntryOrderIntent = EntryOrderParams & { kind: "entry" };

export type PositionTpSlIntent = {
	kind: "positionTpsl";
	assetId: number;
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

export function buildOrderPlan(intent: OrderIntent): OrderPlan {
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

function buildEntryPlan(intent: EntryOrderIntent): OrderPlan {
	const { orders, grouping } = buildOrders(intent);
	return { orders, grouping, errors: [], warnings: [] };
}

function buildPositionTpSlPlan(intent: PositionTpSlIntent): OrderPlan {
	const orders: ExchangeOrder[] = [];
	const isBuy = !intent.isLong;

	if (intent.tpPriceNum && isPositive(intent.tpPriceNum)) {
		orders.push(buildPositionTpSlOrder(intent.assetId, isBuy, intent.tpPriceNum, "tp"));
	}

	if (intent.slPriceNum && isPositive(intent.slPriceNum)) {
		orders.push(buildPositionTpSlOrder(intent.assetId, isBuy, intent.slPriceNum, "sl"));
	}

	return {
		orders,
		grouping: "positionTpsl",
		errors: orders.length === 0 ? ["No TP/SL provided"] : [],
		warnings: [],
	};
}

function buildMarketClosePlan({
	assetId,
	size,
	szDecimals,
	isLong,
	markPx,
	slippageBps,
}: MarketCloseIntent): OrderPlan {
	const side = getCloseSide(isLong);
	const orderPrice = getExecutedPrice("market", side, markPx, slippageBps, markPx);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice),
				s: formatSizeForOrder(size, szDecimals),
				r: true,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
		errors: [],
		warnings: [],
	};
}

function buildLimitClosePlan({ assetId, size, szDecimals, isLong, price }: LimitCloseIntent): OrderPlan {
	const side = getCloseSide(isLong);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(price),
				s: formatSizeForOrder(size, szDecimals),
				r: true,
				t: { limit: { tif: "Gtc" } },
			},
		],
		grouping: "na",
		errors: [],
		warnings: [],
	};
}

function buildReversePlan({ assetId, size, szDecimals, isLong, markPx, slippageBps }: ReverseIntent): OrderPlan {
	const side = getCloseSide(isLong);
	const orderPrice = getExecutedPrice("market", side, markPx, slippageBps, markPx);

	return {
		orders: [
			{
				a: assetId,
				b: side === "buy",
				p: formatPriceForOrder(orderPrice),
				s: formatSizeForOrder(Big(size).times(2).toNumber(), szDecimals),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
		errors: [],
		warnings: [],
	};
}

function buildSwapPlan({ assetId, isBuy, sizeValue, szDecimals, markPx, slippageBps }: SwapIntent): OrderPlan {
	const slippageMultiplier = 1 + slippageBps / 10000;
	const price = isBuy ? markPx * slippageMultiplier : markPx / slippageMultiplier;

	return {
		orders: [
			{
				a: assetId,
				b: isBuy,
				p: formatPriceForOrder(price),
				s: formatSizeForOrder(sizeValue, szDecimals),
				r: false,
				t: { limit: { tif: "FrontendMarket" } },
			},
		],
		grouping: "na",
		errors: [],
		warnings: [],
	};
}

function buildPositionTpSlOrder(
	assetId: number,
	isBuy: boolean,
	triggerPrice: number,
	tpsl: "tp" | "sl",
): ExchangeOrder {
	const triggerPx = formatPriceForOrder(triggerPrice);
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
