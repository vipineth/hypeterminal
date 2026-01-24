import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { deriveOrderEntry, type OrderEntryDerived } from "@/domain/trade/order-entry/derive";
import { getSizeForPercent as getSizeForPercentCalc, getSizeValueForModeToggle } from "@/domain/trade/order-entry/size";
import type { Side } from "@/lib/trade/types";
import { useAccountBalances } from "./use-account-balances";
import { useAssetLeverage } from "./use-asset-leverage";

interface OrderEntryData extends OrderEntryDerived {
	isConnected: boolean;

	// Functions
	getSizeForPercent: (pct: number) => string;
	convertSizeForModeToggle: () => string;

	// Leverage & margin
	leverage: number;
	marginMode: "cross" | "isolated";
	hasPosition: boolean;
	switchMarginMode: (mode: "cross" | "isolated") => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
	isOnlyIsolated: boolean;
	allowsCrossMargin: boolean;
	maxTradeSzs: [number, number] | null;
	availableToBuy: number | null;
	availableToSell: number | null;
}

interface UseOrderEntryDataOptions {
	market: UnifiedMarketInfo | undefined;
	side: Side;
	markPx: number;
	sizeMode: "asset" | "usd";
	sizeInput: string;
}

export function useOrderEntryData({
	market,
	side,
	markPx,
	sizeMode,
	sizeInput,
}: UseOrderEntryDataOptions): OrderEntryData {
	const { isConnected } = useConnection();
	const { perpSummary, spotBalances } = useAccountBalances();
	const {
		displayLeverage: leverage,
		availableToSell,
		availableToBuy,
		maxTradeSzs,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
		isOnlyIsolated,
		allowsCrossMargin,
	} = useAssetLeverage();

	const conversionPrice = markPx > 0 ? markPx : 0;

	const derived = useMemo(
		() =>
			deriveOrderEntry({
				isConnected,
				market,
				side,
				conversionPrice,
				sizeMode,
				sizeInput,
				spotBalances,
				perpSummary,
				maxTradeSzs,
				availableToBuy,
				availableToSell,
			}),
		[
			isConnected,
			market,
			side,
			conversionPrice,
			sizeMode,
			sizeInput,
			spotBalances,
			perpSummary,
			maxTradeSzs,
			availableToBuy,
			availableToSell,
		],
	);

	const getSizeForPercent = useCallback(
		(pct: number): string =>
			getSizeForPercentCalc({
				pct,
				isSpotMarket: derived.isSpotMarket,
				side,
				sizeMode,
				price: conversionPrice,
				maxSize: derived.maxSize,
				spotBalance: derived.spotBalance,
				szDecimals: derived.szDecimals,
			}),
		[
			derived.isSpotMarket,
			derived.maxSize,
			derived.spotBalance,
			derived.szDecimals,
			side,
			sizeMode,
			conversionPrice,
		],
	);

	const convertSizeForModeToggle = useCallback(
		(): string =>
			getSizeValueForModeToggle({
				sizeValue: derived.sizeValue,
				sizeMode,
				price: conversionPrice,
				szDecimals: derived.szDecimals,
			}),
		[derived.sizeValue, derived.szDecimals, sizeMode, conversionPrice],
	);

	return {
		isConnected,
		...derived,
		getSizeForPercent,
		convertSizeForModeToggle,
		leverage,
		marginMode,
		hasPosition,
		switchMarginMode,
		isSwitchingMode,
		switchModeError,
		isOnlyIsolated,
		allowsCrossMargin,
		maxTradeSzs,
		availableToBuy,
		availableToSell,
	};
}
