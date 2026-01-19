import { ORDER_FEE_RATE_MAKER, ORDER_FEE_RATE_TAKER } from "@/config/constants";
import { calc, floorToDecimals, parseNumberOrZero } from "@/lib/trade/numbers";

type OrderType = "market" | "limit";
type Side = "buy" | "sell";

interface MaxSizeInput {
	isConnected: boolean;
	maxTradeSzs: [number, number] | null;
	szDecimals?: number;
	side: Side;
	availableToBuy: number | null;
	availableToSell: number | null;
}

interface SizeValueInput {
	sizeInput: string;
	sizeMode: "asset" | "usd";
	conversionPx: number;
}

interface SizeValueResult {
	sizeInputValue: number;
	sizeValue: number;
}

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

export function getMaxSize(input: MaxSizeInput): number {
	if (!input.isConnected) return 0;
	const maxTradeSize = input.maxTradeSzs?.[1];
	if (typeof maxTradeSize === "number" && maxTradeSize > 0) {
		return floorToDecimals(maxTradeSize, input.szDecimals ?? 0);
	}
	const available = input.side === "buy" ? input.availableToBuy : input.availableToSell;
	if (available === null || available <= 0) return 0;
	return floorToDecimals(available, input.szDecimals ?? 0);
}

export function getConversionPrice(markPx: number, price: number): number {
	return markPx > 0 ? markPx : price;
}

export function getSizeValues(input: SizeValueInput): SizeValueResult {
	const sizeInputValue = parseNumberOrZero(input.sizeInput);
	const sizeValue =
		input.sizeMode === "usd" && input.conversionPx > 0
			? (calc.divide(sizeInputValue, input.conversionPx) ?? 0)
			: sizeInputValue;
	return { sizeInputValue, sizeValue };
}

export function getOrderPrice(orderType: OrderType, markPx: number, limitPriceInput: string): number {
	if (orderType === "market") {
		return markPx;
	}
	return parseNumberOrZero(limitPriceInput);
}

export function getOrderMetrics(input: OrderMetricsInput): OrderMetricsResult {
	const orderValue = calc.multiply(input.sizeValue, input.price) ?? 0;
	const feeRate = input.orderType === "market" ? ORDER_FEE_RATE_TAKER : ORDER_FEE_RATE_MAKER;
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

export function getSliderValue(sizeValue: number, maxSize: number): number {
	if (!maxSize || maxSize <= 0 || !sizeValue || sizeValue <= 0) return 0;
	return Math.min(100, calc.percentOf(sizeValue, maxSize) ?? 0);
}

export function getExecutedPrice(
	orderType: OrderType,
	side: Side,
	markPx: number,
	slippageBps: number,
	price: number,
): number {
	if (orderType === "market") {
		return calc.applySlippage(markPx, slippageBps, side === "buy") ?? markPx;
	}
	return price;
}
