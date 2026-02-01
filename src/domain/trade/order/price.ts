import Big from "big.js";
import { toBig } from "@/lib/trade/numbers";
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
		return toBig(usesLimitPrice(orderType) ? limitPriceInput : triggerPriceInput)?.toNumber() ?? 0;
	}
	if (isScaleOrderType(orderType)) {
		const start = toBig(scaleStartPriceInput);
		const end = toBig(scaleEndPriceInput);
		if (start?.gt(0) && end?.gt(0)) {
			return start.plus(end).div(2).toNumber();
		}
		return start?.gt(0) ? start.toNumber() : (end?.toNumber() ?? 0);
	}
	return toBig(limitPriceInput)?.toNumber() ?? 0;
}

export function getExecutedPrice(
	orderType: OrderType,
	side: Side,
	markPx: number,
	slippageBps: number,
	price: number,
): number {
	if (isMarketExecutionOrderType(orderType)) {
		const px = toBig(markPx);
		const slip = toBig(slippageBps);
		if (!px || !slip) return markPx;
		const multiplier = side === "buy" ? Big(1).plus(slip.div(10000)) : Big(1).minus(slip.div(10000));
		return px.times(multiplier).toNumber();
	}
	return price;
}
