import type { FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import { calc, parseNumber } from "@/lib/trade/numbers";
import type { ApiSide } from "@/lib/trade/types";

export type OpenOrder = FrontendOpenOrdersResponse[number];

export const ORDER_SIDE_CONFIG = {
	B: { label: "long", class: "bg-terminal-green/20 text-terminal-green" },
	A: { label: "short", class: "bg-terminal-red/20 text-terminal-red" },
} as const satisfies Record<ApiSide, { label: string; class: string }>;

export const ORDER_TYPE_CONFIG = {
	takeProfit: { prefix: "Take Profit", class: "bg-terminal-green/20 text-terminal-green" },
	stop: { prefix: "Stop", class: "bg-terminal-amber/20 text-terminal-amber" },
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
	const origSz = parseNumber(order.origSz);
	const remaining = parseNumber(order.sz);
	if (!Number.isFinite(origSz) || !Number.isFinite(remaining)) return Number.NaN;
	return Math.max(0, origSz - remaining);
}

export function getFillPercent(order: OpenOrder): number {
	const origSz = parseNumber(order.origSz);
	const filled = getFilledSize(order);
	if (!Number.isFinite(origSz) || origSz === 0 || !Number.isFinite(filled)) return 0;
	return (filled / origSz) * 100;
}

export function getOrderValue(order: OpenOrder): number | null {
	const limitPx = parseNumber(order.limitPx);
	const origSz = parseNumber(order.origSz);
	return calc.multiply(limitPx, origSz);
}

export function getSideConfig(order: OpenOrder) {
	return ORDER_SIDE_CONFIG[order.side];
}

export function getOrderTypeConfig(order: OpenOrder) {
	const label = order.reduceOnly && !order.isTrigger ? `${order.orderType} RO` : order.orderType;
	const typeClass = isTakeProfitOrder(order)
		? ORDER_TYPE_CONFIG.takeProfit.class
		: isStopOrder(order)
			? ORDER_TYPE_CONFIG.stop.class
			: ORDER_TYPE_CONFIG.default.class;
	return { label, class: typeClass };
}
