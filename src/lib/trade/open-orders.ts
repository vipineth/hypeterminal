import type { FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import type { MarketKind } from "@/lib/hyperliquid/markets/types";
import { toBig } from "@/lib/trade/numbers";

export type OpenOrder = FrontendOpenOrdersResponse[number];

export type OrderSide = OpenOrder["side"];

const SIDE_CLASS = {
	B: "bg-market-up-100 text-market-up-600",
	A: "bg-market-down-100 text-market-down-600",
} as const satisfies Record<OrderSide, string>;

export const ORDER_TYPE_CONFIG = {
	takeProfit: { prefix: "Take Profit", class: "bg-market-up-100 text-market-up-600" },
	stop: { prefix: "Stop", class: "bg-warning-100 text-warning-700" },
	default: { class: "bg-surface-analysis/50" },
} as const;

export function isTakeProfitOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.takeProfit.prefix);
}

export function isStopOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.stop.prefix);
}

export function getOrderValue(order: OpenOrder): number | null {
	const limitPx = toBig(order.limitPx);
	const origSz = toBig(order.origSz);
	if (!limitPx || !origSz) return null;
	return limitPx.times(origSz).toNumber();
}

export function getSideLabel(side: OrderSide, kind?: MarketKind): string {
	if (kind === "spot") return side === "B" ? "buy" : "sell";
	return side === "B" ? "long" : "short";
}

export function getSideClass(side: OrderSide): string {
	return SIDE_CLASS[side];
}

export function getOrderTypeConfig(order: OpenOrder) {
	let typeClass: string = ORDER_TYPE_CONFIG.default.class;
	const label = order.reduceOnly && !order.isTrigger ? `${order.orderType} RO` : order.orderType;

	if (isTakeProfitOrder(order)) {
		typeClass = ORDER_TYPE_CONFIG.takeProfit.class;
	}

	if (isStopOrder(order)) {
		typeClass = ORDER_TYPE_CONFIG.stop.class;
	}

	return { label, class: typeClass };
}
