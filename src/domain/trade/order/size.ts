import Big from "big.js";
import type { SpotBalanceData } from "@/domain/trade/balances";
import { floorToDecimals, formatDecimalFloor, toBig } from "@/lib/trade/numbers";
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
			const quote = toBig(input.spotBalance.quoteAvailable);
			const px = toBig(input.price);
			if (!quote || !px || quote.lte(0) || px.lte(0)) return 0;
			const size = quote.div(px).toNumber();
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
	const inputVal = toBig(input.sizeInput);
	if (!inputVal || inputVal.lte(0)) return 0;

	if (input.sizeMode === "base") return inputVal.toNumber();

	const px = toBig(input.price);
	if (!px || px.lte(0)) return 0;
	const converted = floorToDecimals(inputVal.div(px).toNumber(), input.szDecimals);
	return Number.isFinite(converted) ? converted : 0;
}

export function getOrderValue(sizeValue: number, price: number): number {
	const sz = toBig(sizeValue);
	const px = toBig(price);
	if (!sz || !px || sz.lte(0) || px.lte(0)) return 0;
	return sz.times(px).toNumber();
}

export function getSizeValues(input: SizeValuesInput): SizeValueResult {
	const sizeInputValue = toBig(input.sizeInput)?.toNumber() ?? 0;
	const convPx = toBig(input.conversionPx);
	const sizeValue =
		input.sizeMode === "quote" && convPx?.gt(0) ? Big(sizeInputValue).div(convPx).toNumber() : sizeInputValue;
	return { sizeInputValue, sizeValue };
}

export function getSizeForPercent(input: SizeForPercentInput): string {
	const isBuy = input.side === "buy";
	const isQuoteMode = input.sizeMode === "quote";
	const pct = Big(input.pct).div(100);

	if (input.isSpotMarket) {
		if (isBuy) {
			if (isQuoteMode) {
				const quoteAmount = Big(input.spotBalance.quoteAvailable).times(pct);
				return quoteAmount.toFixed(2);
			}
			const tokenAmount = Big(input.maxSize).times(pct).toNumber();
			return formatSizeValue(tokenAmount, input.szDecimals);
		}

		if (isQuoteMode) {
			if (input.price <= 0) return "";
			const tokenAmount = Big(input.spotBalance.baseAvailable).times(pct);
			const quoteAmount = tokenAmount.times(input.price);
			return quoteAmount.toFixed(2);
		}
		const tokenAmount = Big(input.spotBalance.baseAvailable).times(pct).toNumber();
		return formatSizeValue(tokenAmount, input.szDecimals);
	}

	if (input.maxSize <= 0) return "";
	const size = Big(input.maxSize).times(pct);

	if (isQuoteMode) {
		if (input.price <= 0) return "";
		return size.times(input.price).toFixed(2);
	}
	return formatSizeValue(size.toNumber(), input.szDecimals);
}

export function getSizeValueForModeToggle(input: SizeModeToggleInput): string {
	if (input.sizeValue <= 0 || input.price <= 0) return "";

	if (input.sizeMode === "base") {
		return Big(input.sizeValue).times(input.price).toFixed(2);
	}
	return formatSizeValue(input.sizeValue, input.szDecimals);
}

export function getSliderValue(sizeValue: number, maxSize: number): number {
	const sz = toBig(sizeValue);
	const max = toBig(maxSize);
	if (!sz || !max || sz.lte(0) || max.lte(0)) return 0;
	return Math.min(100, sz.div(max).times(100).toNumber());
}
