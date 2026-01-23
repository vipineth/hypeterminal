import Big from "big.js";
import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { getMarketCapabilities, type MarketCapabilities } from "@/lib/hyperliquid";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side } from "@/lib/trade/types";
import { percent, useAccountBalances, getAvailableForCoin } from "./use-account-balances";
import { useAssetLeverage } from "./use-asset-leverage";

interface SpotBalance {
	base: string;
	quote: string;
	baseToken: string;
	quoteToken: string;
}

interface SideLabels {
	buy: string;
	sell: string;
	buyAria: string;
	sellAria: string;
}

interface OrderEntryData {
	isConnected: boolean;
	isSpotMarket: boolean;
	baseToken: string;
	quoteToken: string;
	capabilities: MarketCapabilities;

	availableBalance: string;
	availableBalanceToken: string;
	spotBalance: SpotBalance;
	perpAvailableBalance: string;

	maxSize: string;
	sizeValue: string;
	orderValue: string;
	conversionPrice: string;

	sideLabels: SideLabels;
	sizeModeLabel: string;

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

	szDecimals: number;
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
	const isSpotMarket = market?.kind === "spot";
	const capabilities = getMarketCapabilities(market);
	const szDecimals = market?.szDecimals ?? 0;

	const { perp, spot } = useAccountBalances();

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

	const spotBalance = useMemo((): SpotBalance => {
		if (!isSpotMarket) {
			return { base: "0", quote: "0", baseToken: "", quoteToken: "USDC" };
		}

		const spotMarket = market?.kind === "spot" ? market : null;
		const baseTokenName = spotMarket?.tokensInfo?.[0]?.name ?? "";
		const quoteTokenName = spotMarket?.tokensInfo?.[1]?.name ?? "USDC";

		return {
			base: getAvailableForCoin(spot, baseTokenName),
			quote: getAvailableForCoin(spot, quoteTokenName),
			baseToken: baseTokenName,
			quoteToken: quoteTokenName,
		};
	}, [isSpotMarket, spot, market]);

	const baseToken = isSpotMarket ? spotBalance.baseToken : (market?.displayName?.split("-")[0] ?? "");
	const quoteToken = isSpotMarket ? spotBalance.quoteToken : "USD";

	const availableBalance = isSpotMarket
		? side === "buy"
			? spotBalance.quote
			: spotBalance.base
		: perp.available;

	const availableBalanceToken = isSpotMarket
		? side === "buy"
			? spotBalance.quoteToken
			: spotBalance.baseToken
		: "USD";

	const conversionPrice = markPx > 0 ? String(markPx) : "0";

	const sizeValue = useMemo((): string => {
		if (!sizeInput || sizeInput === "0") return "0";
		if (sizeMode === "usd" && Big(conversionPrice).gt(0)) {
			return Big(sizeInput).div(conversionPrice).toString();
		}
		return sizeInput;
	}, [sizeMode, sizeInput, conversionPrice]);

	const orderValue = useMemo((): string => {
		if (Big(sizeValue).eq(0) || Big(conversionPrice).eq(0)) return "0";
		return Big(sizeValue).times(conversionPrice).toString();
	}, [sizeValue, conversionPrice]);

	const maxSize = useMemo((): string => {
		if (!isConnected) return "0";

		if (isSpotMarket) {
			if (side === "buy") {
				if (Big(conversionPrice).lte(0) || Big(spotBalance.quote).lte(0)) return "0";
				return Big(spotBalance.quote).div(conversionPrice).toString();
			}
			return spotBalance.base;
		}

		return getPerpMaxSize({
			isConnected,
			maxTradeSzs,
			side,
			availableToBuy,
			availableToSell,
		});
	}, [
		availableToBuy,
		availableToSell,
		isConnected,
		isSpotMarket,
		conversionPrice,
		maxTradeSzs,
		side,
		spotBalance.base,
		spotBalance.quote,
	]);

	const sideLabels = useMemo((): SideLabels => {
		if (isSpotMarket) {
			return { buy: "Buy", sell: "Sell", buyAria: "Buy", sellAria: "Sell" };
		}
		return { buy: "Long", sell: "Short", buyAria: "Buy Long", sellAria: "Sell Short" };
	}, [isSpotMarket]);

	const sizeModeLabel = useMemo(() => {
		if (isSpotMarket) {
			if (side === "buy") {
				return sizeMode === "usd" ? spotBalance.quoteToken || "USDC" : baseToken || "---";
			}
			return sizeMode === "asset" ? baseToken || "---" : spotBalance.quoteToken || "USD";
		}
		return sizeMode === "asset" ? baseToken || "---" : "USD";
	}, [isSpotMarket, side, sizeMode, spotBalance.quoteToken, baseToken]);

	const getSizeForPercent = useCallback(
		(pct: number): string => {
			if (Big(maxSize).lte(0)) return "";

			if (pct === 100) {
				if (isSpotMarket) {
					if (side === "sell") return spotBalance.base;
					if (sizeMode === "usd") return Big(spotBalance.quote).toFixed(2);
					return maxSize;
				}
				if (sizeMode === "usd" && Big(conversionPrice).gt(0)) {
					return Big(maxSize).times(conversionPrice).toFixed(2);
				}
				return maxSize;
			}

			const newSize = percent(maxSize, pct);

			if (isSpotMarket && sizeMode === "usd") {
				if (side === "buy") {
					return Big(percent(availableBalance, pct)).toFixed(2);
				}
				return Big(newSize).times(conversionPrice).toFixed(2);
			}

			if (sizeMode === "usd" && Big(conversionPrice).gt(0)) {
				return Big(newSize).times(conversionPrice).toFixed(2);
			}

			const factor = Big(10).pow(szDecimals);
			return Big(newSize).times(factor).round(0, Big.roundDown).div(factor).toString();
		},
		[maxSize, isSpotMarket, sizeMode, side, availableBalance, conversionPrice, szDecimals, spotBalance.base, spotBalance.quote],
	);

	const convertSizeForModeToggle = useCallback((): string => {
		if (Big(conversionPrice).lte(0) || Big(sizeValue).lte(0)) return "";

		const newMode = sizeMode === "asset" ? "usd" : "asset";
		if (newMode === "usd") {
			return Big(sizeValue).times(conversionPrice).toFixed(2);
		}
		const factor = Big(10).pow(szDecimals);
		return Big(sizeValue).times(factor).round(0, Big.roundDown).div(factor).toString();
	}, [sizeMode, sizeValue, conversionPrice, szDecimals]);

	return {
		isConnected,
		isSpotMarket,
		baseToken,
		quoteToken,
		capabilities,
		availableBalance,
		availableBalanceToken,
		spotBalance,
		perpAvailableBalance: perp.available,
		maxSize,
		sizeValue,
		orderValue,
		conversionPrice,
		sideLabels,
		sizeModeLabel,
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
		szDecimals,
		maxTradeSzs,
		availableToBuy,
		availableToSell,
	};
}

function getPerpMaxSize(input: {
	isConnected: boolean;
	maxTradeSzs: [number, number] | null;
	side: Side;
	availableToBuy: number | null;
	availableToSell: number | null;
}): string {
	if (!input.isConnected) return "0";
	const maxTradeSize = input.maxTradeSzs?.[1];
	if (typeof maxTradeSize === "number" && maxTradeSize > 0) {
		return String(maxTradeSize);
	}
	const available = input.side === "buy" ? input.availableToBuy : input.availableToSell;
	if (available === null || available <= 0) return "0";
	return String(available);
}
