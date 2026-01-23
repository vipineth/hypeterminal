import type { SpotBalanceData } from "@/lib/trade/balances";
import { calc, floorToDecimals, formatDecimalFloor, parseNumberOrZero } from "@/lib/trade/numbers";
import type { Side } from "@/lib/trade/types";

interface MaxSizeInput {
	isConnected: boolean;
	maxTradeSzs: [number, number] | null;
	szDecimals?: number;
	side: Side;
	availableToBuy: number | null;
	availableToSell: number | null;
}

interface OrderEntryMaxSizeInput {
	isConnected: boolean;
	isSpotMarket: boolean;
	side: Side;
	price: number;
	spotBalance: SpotBalanceData;
	szDecimals: number;
	maxTradeSzs: [number, number] | null;
	availableToBuy: number | null;
	availableToSell: number | null;
}

interface SizeValueInput {
	sizeInput: string;
	sizeMode: "asset" | "usd";
	price: number;
	szDecimals: number;
}

interface SizeValueResult {
	sizeInputValue: number;
	sizeValue: number;
}

interface SizeValuesInput {
	sizeInput: string;
	sizeMode: "asset" | "usd";
	conversionPx: number;
}

interface SizeForPercentInput {
	pct: number;
	isSpotMarket: boolean;
	side: Side;
	sizeMode: "asset" | "usd";
	price: number;
	maxSize: number;
	spotBalance: SpotBalanceData;
	szDecimals: number;
}

interface SizeModeToggleInput {
	sizeValue: number;
	sizeMode: "asset" | "usd";
	price: number;
	szDecimals: number;
}

function formatSizeValue(value: number, decimals: number): string {
	if (!Number.isFinite(value) || value <= 0) return "0";
	return formatDecimalFloor(value, decimals);
}

export function getMaxSizeForOrderEntry(input: OrderEntryMaxSizeInput): number {
	if (!input.isConnected) return 0;

	if (input.isSpotMarket) {
		if (input.side === "buy") {
			if (input.price <= 0 || input.spotBalance.quoteAvailable <= 0) return 0;
			const size = input.spotBalance.quoteAvailable / input.price;
			const floored = floorToDecimals(size, input.szDecimals);
			return Number.isFinite(floored) ? floored : 0;
		}
		const floored = floorToDecimals(input.spotBalance.baseAvailable, input.szDecimals);
		return Number.isFinite(floored) ? floored : 0;
	}

	const maxTradeSize = input.maxTradeSzs?.[1];
	if (typeof maxTradeSize === "number" && maxTradeSize > 0) {
		return maxTradeSize;
	}
	const available = input.side === "buy" ? input.availableToBuy : input.availableToSell;
	return available ?? 0;
}

export function getMaxSize(input: MaxSizeInput): number {
	if (!input.isConnected) return 0;
	const maxTradeSize = input.maxTradeSzs?.[1];
	if (typeof maxTradeSize === "number" && maxTradeSize > 0) {
		const floored = floorToDecimals(maxTradeSize, input.szDecimals ?? 0);
		return Number.isFinite(floored) ? floored : 0;
	}
	const available = input.side === "buy" ? input.availableToBuy : input.availableToSell;
	if (available === null || available <= 0) return 0;
	const floored = floorToDecimals(available, input.szDecimals ?? 0);
	return Number.isFinite(floored) ? floored : 0;
}

export function getSizeValueFromInput(input: SizeValueInput): number {
	const inputValue = parseNumberOrZero(input.sizeInput);
	if (inputValue <= 0) return 0;

	if (input.sizeMode === "usd") {
		if (input.price <= 0) return 0;
		const converted = floorToDecimals(inputValue / input.price, input.szDecimals);
		return Number.isFinite(converted) ? converted : 0;
	}

	return inputValue;
}

export function getOrderValue(sizeValue: number, price: number): number {
	if (sizeValue <= 0 || price <= 0) return 0;
	return calc.multiply(sizeValue, price) ?? 0;
}

export function getSizeValues(input: SizeValuesInput): SizeValueResult {
	const sizeInputValue = parseNumberOrZero(input.sizeInput);
	const sizeValue =
		input.sizeMode === "usd" && input.conversionPx > 0
			? (calc.divide(sizeInputValue, input.conversionPx) ?? 0)
			: sizeInputValue;
	return { sizeInputValue, sizeValue };
}

export function getSizeForPercent(input: SizeForPercentInput): string {
	if (input.price <= 0) return "";

	if (input.isSpotMarket) {
		if (input.side === "buy") {
			if (input.sizeMode === "usd") {
				const usdAmount = (input.spotBalance.quoteAvailable * input.pct) / 100;
				return usdAmount.toFixed(2);
			}
			const tokenAmount = (input.maxSize * input.pct) / 100;
			return formatSizeValue(tokenAmount, input.szDecimals);
		}

		if (input.sizeMode === "usd") {
			const tokenAmount = (input.spotBalance.baseAvailable * input.pct) / 100;
			const usdAmount = tokenAmount * input.price;
			return usdAmount.toFixed(2);
		}
		const tokenAmount = (input.spotBalance.baseAvailable * input.pct) / 100;
		return formatSizeValue(tokenAmount, input.szDecimals);
	}

	if (input.maxSize <= 0) return "";
	const size = (input.maxSize * input.pct) / 100;

	if (input.sizeMode === "usd") {
		return (size * input.price).toFixed(2);
	}
	return formatSizeValue(size, input.szDecimals);
}

export function getSizeValueForModeToggle(input: SizeModeToggleInput): string {
	if (input.sizeValue <= 0 || input.price <= 0) return "";

	if (input.sizeMode === "asset") {
		return (input.sizeValue * input.price).toFixed(2);
	}
	return formatSizeValue(input.sizeValue, input.szDecimals);
}

export function getSliderValue(sizeValue: number, maxSize: number): number {
	if (!maxSize || maxSize <= 0 || !sizeValue || sizeValue <= 0) return 0;
	return Math.min(100, calc.percentOf(sizeValue, maxSize) ?? 0);
}
