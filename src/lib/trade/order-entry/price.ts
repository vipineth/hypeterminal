import { calc, parseNumberOrZero } from "@/lib/trade/numbers";
import {
	isMarketExecutionOrderType,
	isScaleOrderType,
	isStopOrderType,
	isTakeProfitOrderType,
	isTwapOrderType,
	type OrderType,
	usesLimitPrice,
} from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

export function getConversionPrice(markPx: number, price: number): number {
	return markPx > 0 ? markPx : price;
}

export function getOrderPrice(
	orderType: OrderType,
	markPx: number,
	limitPriceInput: string,
	triggerPriceInput: string,
	scaleStartPriceInput: string,
	scaleEndPriceInput: string,
): number {
	if (orderType === "market" || isTwapOrderType(orderType)) {
		return markPx;
	}
	if (isStopOrderType(orderType) || isTakeProfitOrderType(orderType)) {
		return usesLimitPrice(orderType) ? parseNumberOrZero(limitPriceInput) : parseNumberOrZero(triggerPriceInput);
	}
	if (isScaleOrderType(orderType)) {
		const start = parseNumberOrZero(scaleStartPriceInput);
		const end = parseNumberOrZero(scaleEndPriceInput);
		if (start > 0 && end > 0) {
			return calc.divide(calc.add(start, end), 2) ?? start;
		}
		return start > 0 ? start : end;
	}
	return parseNumberOrZero(limitPriceInput);
}

export function getExecutedPrice(
	orderType: OrderType,
	side: Side,
	markPx: number,
	slippageBps: number,
	price: number,
): number {
	if (isMarketExecutionOrderType(orderType)) {
		return calc.applySlippage(markPx, slippageBps, side === "buy") ?? markPx;
	}
	return price;
}
