import { ORDER_FEE_RATE_MAKER, ORDER_FEE_RATE_TAKER } from "@/config/constants";
import { calc } from "@/lib/trade/numbers";
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
	const orderValue = calc.multiply(input.sizeValue, input.price) ?? 0;
	const feeRate = isTakerOrderType(input.orderType) ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
	const estimatedFee = calc.multiply(orderValue, feeRate) ?? 0;
	const marginRequired = input.leverage ? (calc.divide(orderValue, input.leverage) ?? 0) : 0;
	return { orderValue, marginRequired, estimatedFee };
}

export function getLiquidationInfo(input: LiquidationInput): LiquidationResult {
	if (!input.price || !input.sizeValue || !input.leverage) {
		return { liqPrice: null, liqWarning: false };
	}
	const leverageMultiplier = calc.divide(1, input.leverage);
	const buffer =
		leverageMultiplier !== null ? calc.multiply(calc.multiply(input.price, leverageMultiplier), 0.9) : null;
	if (buffer === null) {
		return { liqPrice: null, liqWarning: false };
	}
	const liqPrice = input.side === "buy" ? calc.subtract(input.price, buffer) : calc.add(input.price, buffer);
	if (liqPrice === null) {
		return { liqPrice: null, liqWarning: false };
	}
	const priceDiff = Math.abs(liqPrice - input.price);
	const liqWarning = calc.divide(priceDiff, input.price) !== null && (calc.divide(priceDiff, input.price) ?? 1) < 0.05;
	return { liqPrice, liqWarning };
}
