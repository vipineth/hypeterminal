import type { SpotBalanceData } from "@/domain/trade/balances";
import { calc, floorToDecimals, formatDecimalFloor, parseNumberOrZero } from "@/lib/trade/numbers";
import type { Side, SizeMode } from "@/lib/trade/types";

interface MaxSizeInput {
	isConnected: boolean;
	maxTradeSzs: [number, number] | null;
	szDecimals?: number;
	side: Side;
}

interface OrderEntryMaxSizeInput {
	isConnected: boolean;
	isSpotMarket: boolean;
	side: Side;
	price: number;
	spotBalance: SpotBalanceData;
	szDecimals: number;
	maxTradeSzs: [number, number] | null;
}

interface SizeValueInput {
	sizeInput: string;
	sizeMode: SizeMode;
	price: number;
	szDecimals: number;
}

interface SizeValueResult {
	sizeInputValue: number;
	sizeValue: number;
}

interface SizeValuesInput {
	sizeInput: string;
	sizeMode: SizeMode;
	conversionPx: number;
}

interface SizeForPercentInput {
	pct: number;
	isSpotMarket: boolean;
	side: Side;
	sizeMode: SizeMode;
	price: number;
	maxSize: number;
	spotBalance: SpotBalanceData;
	szDecimals: number;
}

interface SizeModeToggleInput {
	sizeValue: number;
	sizeMode: SizeMode;
	price: number;
	szDecimals: number;
}

function formatSizeValue(value: number, decimals: number): string {
	if (!Number.isFinite(value) || value <= 0) return "0";
	return formatDecimalFloor(value, decimals);
}

export function getMaxSizeForOrderEntry(input: OrderEntryMaxSizeInput): number {
	if (!input.isConnected) return 0;

	const isBuy = input.side === "buy";

	if (input.isSpotMarket) {
		if (isBuy) {
			if (input.price <= 0 || input.spotBalance.quoteAvailable <= 0) return 0;
			const size = calc.divide(input.spotBalance.quoteAvailable, input.price);
			if (size === null || !Number.isFinite(size)) return 0;
			const floored = floorToDecimals(size, input.szDecimals);
			return Number.isFinite(floored) ? floored : 0;
		}
		const floored = floorToDecimals(input.spotBalance.baseAvailable, input.szDecimals);
		return Number.isFinite(floored) ? floored : 0;
	}

	const maxTradeSize = input.maxTradeSzs?.[isBuy ? 0 : 1] ?? 0;
	return maxTradeSize > 0 ? maxTradeSize : 0;
}

export function getMaxSize(input: MaxSizeInput): number {
	if (!input.isConnected) return 0;

	const maxTradeSize = input.maxTradeSzs?.[input.side === "buy" ? 0 : 1] ?? 0;
	if (maxTradeSize > 0) {
		const floored = floorToDecimals(maxTradeSize, input.szDecimals ?? 0);
		return Number.isFinite(floored) ? floored : 0;
	}
	return 0;
}

export function getSizeValueFromInput(input: SizeValueInput): number {
	const inputValue = parseNumberOrZero(input.sizeInput);
	if (inputValue <= 0) return 0;

	if (input.sizeMode === "base") return inputValue;

	if (input.price <= 0) return 0;
	const convertedValue = calc.divide(inputValue, input.price);
	if (convertedValue === null || !Number.isFinite(convertedValue)) return 0;
	const converted = floorToDecimals(convertedValue, input.szDecimals);
	return Number.isFinite(converted) ? converted : 0;
}

export function getOrderValue(sizeValue: number, price: number): number {
	if (sizeValue <= 0 || price <= 0) return 0;
	return calc.multiply(sizeValue, price) ?? 0;
}

export function getSizeValues(input: SizeValuesInput): SizeValueResult {
	const sizeInputValue = parseNumberOrZero(input.sizeInput);
	const sizeValue =
		input.sizeMode === "quote" && input.conversionPx > 0
			? (calc.divide(sizeInputValue, input.conversionPx) ?? 0)
			: sizeInputValue;
	return { sizeInputValue, sizeValue };
}

export function getSizeForPercent(input: SizeForPercentInput): string {
	const isBuy = input.side === "buy";
	const isQuoteMode = input.sizeMode === "quote";

	if (input.isSpotMarket) {
		if (isBuy) {
			if (isQuoteMode) {
				const quoteAmount = (input.spotBalance.quoteAvailable * input.pct) / 100;
				return quoteAmount.toFixed(2);
			}
			const tokenAmount = (input.maxSize * input.pct) / 100;
			return formatSizeValue(tokenAmount, input.szDecimals);
		}

		if (isQuoteMode) {
			if (input.price <= 0) return "";
			const tokenAmount = (input.spotBalance.baseAvailable * input.pct) / 100;
			const quoteAmount = tokenAmount * input.price;
			return quoteAmount.toFixed(2);
		}
		const tokenAmount = (input.spotBalance.baseAvailable * input.pct) / 100;
		return formatSizeValue(tokenAmount, input.szDecimals);
	}

	if (input.maxSize <= 0) return "";
	const size = (input.maxSize * input.pct) / 100;

	if (isQuoteMode) {
		if (input.price <= 0) return "";
		return (size * input.price).toFixed(2);
	}
	return formatSizeValue(size, input.szDecimals);
}

export function getSizeValueForModeToggle(input: SizeModeToggleInput): string {
	if (input.sizeValue <= 0 || input.price <= 0) return "";

	if (input.sizeMode === "base") {
		return (input.sizeValue * input.price).toFixed(2);
	}
	return formatSizeValue(input.sizeValue, input.szDecimals);
}

export function getSliderValue(sizeValue: number, maxSize: number): number {
	if (!maxSize || maxSize <= 0 || !sizeValue || sizeValue <= 0) return 0;
	return Math.min(100, calc.percentOf(sizeValue, maxSize) ?? 0);
}
