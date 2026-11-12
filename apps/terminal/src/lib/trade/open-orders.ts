import type { FrontendOpenOrdersResponse } from "@nktkas/hyperliquid";
import { OPEN_ORDER_TYPE_PREFIXES } from "@/config/trade";
import type { MarketKind } from "@/lib/hyperliquid/markets";
import { toBig } from "@/lib/trade/numbers";

export type OpenOrder = FrontendOpenOrdersResponse[number];

export type OrderSide = OpenOrder["side"];

export interface TpSlOrderInfo {
	tpPrice?: number;
	slPrice?: number;
	tpOrderId?: number;
	slOrderId?: number;
}

export function isTakeProfitOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(OPEN_ORDER_TYPE_PREFIXES.takeProfit);
}

export function isStopOrder(order: OpenOrder): boolean {
	return order.orderType.startsWith(OPEN_ORDER_TYPE_PREFIXES.stop);
}

export function isMarketTriggerOrder(order: OpenOrder): boolean {
	return order.isTrigger && order.orderType.endsWith("Market");
}

export function isClosePositionOrder(order: OpenOrder): boolean {
	if (!order.isPositionTpsl) return false;
	const origSz = toBig(order.origSz);
	return !!origSz && origSz.eq(0);
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

export function buildTpSlOrdersByCoin(orders: readonly OpenOrder[]): Map<string, TpSlOrderInfo> {
	const map = new Map<string, TpSlOrderInfo>();
	for (const order of orders) {
		if (!order.isTrigger) continue;

		const triggerPx = toBig(order.triggerPx)?.toNumber();
		if (!triggerPx || triggerPx <= 0) continue;

		const existing = map.get(order.coin) ?? {};
		if (isTakeProfitOrder(order) && !existing.tpPrice) {
			existing.tpPrice = triggerPx;
			existing.tpOrderId = order.oid;
		} else if (isStopOrder(order) && !existing.slPrice) {
			existing.slPrice = triggerPx;
			existing.slOrderId = order.oid;
		}
		map.set(order.coin, existing);
	}
	return map;
}

export function getOrderLineLabel(order: OpenOrder): string {
	if (isTakeProfitOrder(order)) return "TP";
	if (isStopOrder(order)) return "SL";
	return order.side === "B" ? "Limit Buy" : "Limit Sell";
}

export interface OrderTypeConfig {
	fullLabel: string;
	triggerLabel: "Stop" | "Take Profit" | null;
	triggerClass: string | null;
	executionLabel: string;
	reduceOnly: boolean;
}

export function getOrderTypeConfig(order: OpenOrder): OrderTypeConfig {
	const reduceOnly = order.reduceOnly;
	const suffix = reduceOnly ? " RO" : "";
	const fullLabel = `${order.orderType}${suffix}`;

	let triggerLabel: "Stop" | "Take Profit" | null = null;
	let triggerClass: string | null = null;
	if (isStopOrder(order)) {
		triggerLabel = "Stop";
		triggerClass = "text-warning";
	} else if (isTakeProfitOrder(order)) {
		triggerLabel = "Take Profit";
		triggerClass = "text-success";
	}

	const executionLabel = order.orderType.endsWith("Market") ? "Market" : "Limit";

	return { fullLabel, triggerLabel, triggerClass, executionLabel, reduceOnly };
}
