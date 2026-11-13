import Big from "big.js";
import type { OrderType } from "@/config/trade";
import { type Numeric, toBig } from "@/lib/trade/numbers";
import {
	isScaleOrderType,
	isStopOrderType,
	isTakeProfitOrderType,
	isTwapOrderType,
	usesLimitPrice,
} from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

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

export function getMarketPrice(side: Side, markPx: Numeric, slippageBps: number): string {
	const px = toBig(markPx);
	const slip = toBig(slippageBps)?.div(10000);
	if (!px || !slip) return px?.toFixed() ?? "";
	return px.times(side === "buy" ? Big(1).plus(slip) : Big(1).minus(slip)).toFixed();
}
