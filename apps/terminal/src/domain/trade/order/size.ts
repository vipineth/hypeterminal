import Big from "big.js";
import type { SpotBalanceData } from "@/domain/trade/balances";
import { floorToDecimals, toBig, truncateDecimals } from "@/lib/trade/numbers";
import type { Side, SizeMode, SizeUnit } from "@/lib/trade/types";

export const QUOTE_SIZE_DECIMALS = 2;

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

interface SizeUnitMarket {
	assetId: number;
	szDecimals: number;
}

export function getSizeUnit(market: SizeUnitMarket | undefined, mode: SizeMode): SizeUnit {
	return { mode, assetId: market?.assetId ?? null, szDecimals: market?.szDecimals ?? 0 };
}

export function readSizeInput(size: string, typedIn: SizeUnit | null, current: SizeUnit): string {
	if (!typedIn) return "";
	const sameUnit =
		typedIn.mode === current.mode && typedIn.assetId === current.assetId && typedIn.szDecimals === current.szDecimals;
	return sameUnit ? size : "";
}

function getQuoteSizeForLots(lots: Big, price: number, szDecimals: number): string | null {
	const quote = lots.times(price).round(QUOTE_SIZE_DECIMALS, Big.roundUp).toFixed(QUOTE_SIZE_DECIMALS);
	const lotsBack = getSizeValueFromInput({ sizeInput: quote, sizeMode: "quote", price, szDecimals });
	return lots.eq(lotsBack) ? quote : null;
}

function getQuoteSizeForPercent(lots: Big, price: number, szDecimals: number): string {
	return (
		getQuoteSizeForLots(lots, price, szDecimals) ??
		lots.times(price).round(QUOTE_SIZE_DECIMALS, Big.roundDown).toFixed(QUOTE_SIZE_DECIMALS)
	);
}

function formatSizeValue(value: number, decimals: number): string {
	if (!Number.isFinite(value) || value <= 0) return "0";
	return truncateDecimals(value, decimals);
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

export function getSizeFromInput(input: SizeValueInput): string {
	const inputVal = toBig(input.sizeInput);
	if (!inputVal || inputVal.lte(0)) return "0";

	if (input.sizeMode === "base") return inputVal.toFixed();

	const px = toBig(input.price);
	if (!px || px.lte(0)) return "0";
	return inputVal.div(px).round(input.szDecimals, Big.roundDown).toFixed();
}

export function getSizeValueFromInput(input: SizeValueInput): number {
	return Number(getSizeFromInput(input));
}

export function getOrderValue(sizeValue: number, price: number): number {
	const sz = toBig(sizeValue);
	const px = toBig(price);
	if (!sz || !px || sz.lte(0) || px.lte(0)) return 0;
	return sz.times(px).toNumber();
}

export function getSizeForPercent(input: SizeForPercentInput): string {
	const isBuy = input.side === "buy";
	const isQuoteMode = input.sizeMode === "quote";
	const pct = Big(input.pct).div(100);

	if (input.isSpotMarket) {
		if (isBuy) {
			if (isQuoteMode) {
				const quoteAmount = Big(input.spotBalance.quoteAvailable).times(pct);
				return quoteAmount.round(QUOTE_SIZE_DECIMALS, Big.roundDown).toFixed(QUOTE_SIZE_DECIMALS);
			}
			const tokenAmount = Big(input.maxSize).times(pct).toNumber();
			return formatSizeValue(tokenAmount, input.szDecimals);
		}

		if (isQuoteMode) {
			if (input.price <= 0) return "";
			const lots = Big(input.spotBalance.baseAvailable).times(pct).round(input.szDecimals, Big.roundDown);
			return getQuoteSizeForPercent(lots, input.price, input.szDecimals);
		}
		const tokenAmount = Big(input.spotBalance.baseAvailable).times(pct).toNumber();
		return formatSizeValue(tokenAmount, input.szDecimals);
	}

	if (input.maxSize <= 0) return "";
	const size = Big(input.maxSize).times(pct);

	if (isQuoteMode) {
		if (input.price <= 0) return "";
		return getQuoteSizeForPercent(size.round(input.szDecimals, Big.roundDown), input.price, input.szDecimals);
	}
	return formatSizeValue(size.toNumber(), input.szDecimals);
}

export function getSizeValueForModeToggle(input: SizeModeToggleInput): string {
	if (input.sizeValue <= 0 || input.price <= 0) return "";

	if (input.sizeMode === "base") {
		return getQuoteSizeForLots(Big(input.sizeValue), input.price, input.szDecimals) ?? "";
	}
	return formatSizeValue(input.sizeValue, input.szDecimals);
}

export function getSliderValue(sizeValue: number, maxSize: number): number {
	const sz = toBig(sizeValue);
	const max = toBig(maxSize);
	if (!sz || !max || sz.lte(0) || max.lte(0)) return 0;
	return Math.min(100, sz.div(max).times(100).toNumber());
}
