import Big from "big.js";
import { ORDER_FEE_RATE_MAKER, ORDER_FEE_RATE_TAKER } from "@/config/constants";
import { toBig } from "@/lib/trade/numbers";
import { isTakerOrderType, type OrderType } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";

interface OrderMetricsInput {
	sizeValue: number;
	price: number;
	leverage: number | null;
	orderType: OrderType;
}

interface OrderMetricsResult {
	orderValue: number;
	marginRequired: number;
	estimatedFee: number;
}

interface LiquidationInput {
	price: number;
	sizeValue: number;
	leverage: number | null;
	side: Side;
}

interface LiquidationResult {
	liqPrice: number | null;
	liqWarning: boolean;
}

export function getOrderMetrics(input: OrderMetricsInput): OrderMetricsResult {
	const sz = toBig(input.sizeValue);
	const px = toBig(input.price);
	const orderValue = sz && px ? sz.times(px).toNumber() : 0;
	const feeRate = isTakerOrderType(input.orderType) ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
	const estimatedFee = Big(orderValue).times(feeRate).toNumber();
	const marginRequired = input.leverage ? Big(orderValue).div(input.leverage).toNumber() : 0;
	return { orderValue, marginRequired, estimatedFee };
}

export function getLiquidationInfo(input: LiquidationInput): LiquidationResult {
	const px = toBig(input.price);
	const lev = toBig(input.leverage);
	if (!px || !lev || !input.sizeValue || px.lte(0) || lev.lte(0)) {
		return { liqPrice: null, liqWarning: false };
	}
	const buffer = px.div(lev).times(0.9);
	const liqPrice = input.side === "buy" ? px.minus(buffer).toNumber() : px.plus(buffer).toNumber();
	const priceDiff = Math.abs(liqPrice - input.price);
	const liqWarning = Big(priceDiff).div(input.price).lt(0.05);
	return { liqPrice, liqWarning };
}
