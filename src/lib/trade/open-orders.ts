import type { FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import { toBig } from "@/lib/trade/numbers";

export type OpenOrder = FrontendOpenOrdersResponse[number];

export type OrderSide = OpenOrder["side"];

export const ORDER_SIDE_CONFIG = {
	B: { label: "long", class: "bg-positive/20 text-positive" },
	A: { label: "short", class: "bg-negative/20 text-negative" },
} as const satisfies Record<OrderSide, { label: string; class: string }>;

export const ORDER_TYPE_CONFIG = {
	takeProfit: { prefix: "Take Profit", class: "bg-positive/20 text-positive" },
	stop: { prefix: "Stop", class: "bg-warning/20 text-warning" },
	default: { class: "bg-accent/50" },
} as const;

export function isLongOrder(order: OpenOrder): boolean {
	return order.side === "B";
}

export function isTakeProfitOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.takeProfit.prefix);
}

export function isStopOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(ORDER_TYPE_CONFIG.stop.prefix);
}

export function getFilledSize(order: OpenOrder): number {
	const origSz = toBig(order.origSz);
	const remaining = toBig(order.sz);
	if (!origSz || !remaining) return Number.NaN;
	return origSz.minus(remaining).toNumber();
}

export function getFillPercent(order: OpenOrder): number {
	const origSz = toBig(order.origSz);
	const filled = getFilledSize(order);
	if (!origSz || origSz.eq(0) || !Number.isFinite(filled)) return 0;
	return toBig(filled)?.div(origSz).times(100).toNumber() ?? 0;
}

export function getOrderValue(order: OpenOrder): number | null {
	const limitPx = toBig(order.limitPx);
	const origSz = toBig(order.origSz);
	if (!limitPx || !origSz) return null;
	return limitPx.times(origSz).toNumber();
}

export function getSideConfig(order: OpenOrder) {
	return ORDER_SIDE_CONFIG[order.side];
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
