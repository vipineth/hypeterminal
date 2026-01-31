import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { deriveOrderEntry, type OrderEntryDerived } from "@/domain/trade/order/derive";
import { getSizeForPercent as getSizeForPercentCalc, getSizeValueForModeToggle } from "@/domain/trade/order/size";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side, SizeMode } from "@/lib/trade/types";
import { useAccountBalances } from "./use-account-balances";
import { useAssetLeverage } from "./use-asset-leverage";

interface OrderEntryData extends OrderEntryDerived {
	isConnected: boolean;

	getSizeForPercent: (pct: number) => string;
	convertSizeForModeToggle: () => string;

	leverage: number;
	marginMode: "cross" | "isolated";
	hasPosition: boolean;
	switchMarginMode: (mode: "cross" | "isolated") => Promise<void>;
	isSwitchingMode: boolean;
	switchModeError: Error | null;
	isOnlyIsolated: boolean;
	allowsCrossMargin: boolean;
	maxTradeSzs: [number, number] | null;
}

interface UseOrderEntryDataOptions {
	market: UnifiedMarketInfo | undefined;
	side: Side;
	markPx: number;
	sizeMode: SizeMode;
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
	const { spotBalances } = useAccountBalances();
	const {
		displayLeverage: leverage,
		maxTradeSzs,
		availableToTrade,
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
				maxTradeSzs,
				availableToTrade,
			}),
		[isConnected, market, side, conversionPrice, sizeMode, sizeInput, spotBalances, maxTradeSzs, availableToTrade],
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
		[derived.isSpotMarket, derived.maxSize, derived.spotBalance, derived.szDecimals, side, sizeMode, conversionPrice],
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
	};
}
