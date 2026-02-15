import Big from "big.js";
import { getExecutedPrice } from "@/domain/trade/order/price";
import { buildOrders, formatPriceForOrder, formatSizeForOrder } from "@/domain/trade/orders";
import { isPositive } from "@/lib/trade/numbers";
import {
	type ExchangeOrder,
	isScaleOrderType,
	isStopOrderType,
	isTriggerOrderType,
	type LimitTif,
	type OrderType,
	usesLimitPrice,
} from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

export type OrderPlan = {
	orders: ExchangeOrder[];
	grouping: "na" | "normalTpsl" | "positionTpsl";
	errors: string[];
	warnings: string[];
};

export type EntryOrderIntent = {
	kind: "entry";
	assetId: number;
	side: Side;
	orderType: OrderType;
	sizeValue: number;
	szDecimals: number;
	markPx: number;
	price: number;
	slippageBps: number;
	reduceOnly: boolean;
	tif: LimitTif;
	limitPriceInput: string;
	triggerPriceInput: string;
	scaleStartPriceInput: string;
	scaleEndPriceInput: string;
	scaleLevelsNum: number | null;
	tpSlEnabled: boolean;
	canUseTpSl: boolean;
	tpPriceNum: number | null;
	slPriceNum: number | null;
};

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

export type OrderIntent = EntryOrderIntent | PositionTpSlIntent | MarketCloseIntent | LimitCloseIntent | ReverseIntent;

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
		default:
			return assertNever(intent);
	}
}

function getCloseSide(isLong: boolean): Side {
	return isLong ? "sell" : "buy";
}

function buildEntryPlan(intent: EntryOrderIntent): OrderPlan {
	const orderType = intent.orderType;
	const { orders, grouping } = buildOrders({
		assetId: intent.assetId,
		side: intent.side,
		orderType,
		sizeValue: intent.sizeValue,
		szDecimals: intent.szDecimals,
		markPx: intent.markPx,
		price: intent.price,
		slippageBps: intent.slippageBps,
		reduceOnly: intent.reduceOnly,
		tif: intent.tif,
		limitPriceInput: intent.limitPriceInput,
		triggerPriceInput: intent.triggerPriceInput,
		scaleStartPriceInput: intent.scaleStartPriceInput,
		scaleEndPriceInput: intent.scaleEndPriceInput,
		scaleLevelsNum: intent.scaleLevelsNum,
		tpSlEnabled: intent.tpSlEnabled,
		canUseTpSl: intent.canUseTpSl,
		tpPriceNum: intent.tpPriceNum,
		slPriceNum: intent.slPriceNum,
		isStopOrder: isStopOrderType(orderType),
		isTriggerOrder: isTriggerOrderType(orderType),
		isScaleOrder: isScaleOrderType(orderType),
		usesLimitPriceForOrder: usesLimitPrice(orderType),
	});

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
