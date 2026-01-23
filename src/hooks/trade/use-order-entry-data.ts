import { useCallback, useMemo } from "react";
import { useConnection } from "wagmi";
import { getMarketCapabilities, type MarketCapabilities } from "@/lib/hyperliquid";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side } from "@/lib/trade/types";
import { getSpotBalance, useAccountBalances } from "./use-account-balances";
import { useAssetLeverage } from "./use-asset-leverage";

// Floor a number to specific decimal places
function floor(value: number, decimals: number): number {
	if (!Number.isFinite(value) || value <= 0) return 0;
	const factor = 10 ** decimals;
	return Math.floor(value * factor) / factor;
}

// Format a number to string with specific decimal places, trimming trailing zeros
function toStr(value: number, decimals: number): string {
	if (!Number.isFinite(value) || value <= 0) return "0";
	return floor(value, decimals).toString();
}

interface SpotBalanceData {
	baseAvailable: number;
	quoteAvailable: number;
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
	szDecimals: number;

	// Balances
	availableBalance: number;
	availableBalanceToken: string;
	perpAvailable: number;
	spotBalance: SpotBalanceData;

	// Size calculations
	maxSize: number;
	sizeValue: number;
	orderValue: number;

	// UI
	sideLabels: SideLabels;
	sizeModeLabel: string;

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
	const isSpotMarket = market?.kind === "spot";
	const capabilities = getMarketCapabilities(market);
	const szDecimals = market?.szDecimals ?? 0;
	const price = markPx > 0 ? markPx : 0;

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

	// Parse perp available balance
	const perpAvailable = useMemo(() => {
		const accountValue = parseFloat(perp.accountValue) || 0;
		const marginUsed = parseFloat(perp.totalMarginUsed) || 0;
		return Math.max(0, accountValue - marginUsed);
	}, [perp.accountValue, perp.totalMarginUsed]);

	// Parse spot balances for current market
	const spotBalance = useMemo((): SpotBalanceData => {
		if (!isSpotMarket || market?.kind !== "spot") {
			return { baseAvailable: 0, quoteAvailable: 0, baseToken: "", quoteToken: "USDC" };
		}

		const baseToken = market.tokensInfo?.[0]?.name ?? "";
		const quoteToken = market.tokensInfo?.[1]?.name ?? "USDC";

		const baseBalance = getSpotBalance(spot, baseToken);
		const quoteBalance = getSpotBalance(spot, quoteToken);

		const baseTotal = parseFloat(baseBalance?.total ?? "0") || 0;
		const baseHold = parseFloat(baseBalance?.hold ?? "0") || 0;
		const quoteTotal = parseFloat(quoteBalance?.total ?? "0") || 0;
		const quoteHold = parseFloat(quoteBalance?.hold ?? "0") || 0;

		return {
			baseAvailable: Math.max(0, baseTotal - baseHold),
			quoteAvailable: Math.max(0, quoteTotal - quoteHold),
			baseToken,
			quoteToken,
		};
	}, [isSpotMarket, market, spot]);

	const baseToken = isSpotMarket ? spotBalance.baseToken : (market?.displayName?.split("-")[0] ?? "");
	const quoteToken = isSpotMarket ? spotBalance.quoteToken : "USD";

	const availableBalance = isSpotMarket
		? side === "buy"
			? spotBalance.quoteAvailable
			: spotBalance.baseAvailable
		: perpAvailable;

	const availableBalanceToken = isSpotMarket
		? side === "buy"
			? spotBalance.quoteToken
			: spotBalance.baseToken
		: "USD";

	const maxSize = useMemo((): number => {
		if (!isConnected) return 0;

		if (isSpotMarket) {
			if (side === "buy") {
				if (price <= 0 || spotBalance.quoteAvailable <= 0) return 0;
				return floor(spotBalance.quoteAvailable / price, szDecimals);
			}
			return floor(spotBalance.baseAvailable, szDecimals);
		}

		const maxTradeSize = maxTradeSzs?.[1];
		if (typeof maxTradeSize === "number" && maxTradeSize > 0) {
			return maxTradeSize;
		}
		const available = side === "buy" ? availableToBuy : availableToSell;
		return available ?? 0;
	}, [isConnected, isSpotMarket, side, price, spotBalance, szDecimals, maxTradeSzs, availableToBuy, availableToSell]);

	const sizeValue = useMemo((): number => {
		const input = parseFloat(sizeInput) || 0;
		if (input <= 0) return 0;

		if (sizeMode === "usd" && price > 0) {
			return floor(input / price, szDecimals);
		}
		return input;
	}, [sizeInput, sizeMode, price, szDecimals]);

	const orderValue = useMemo((): number => {
		if (sizeValue <= 0 || price <= 0) return 0;
		return sizeValue * price;
	}, [sizeValue, price]);

	const sideLabels = useMemo((): SideLabels => {
		if (isSpotMarket) {
			return { buy: "Buy", sell: "Sell", buyAria: "Buy", sellAria: "Sell" };
		}
		return { buy: "Long", sell: "Short", buyAria: "Buy Long", sellAria: "Sell Short" };
	}, [isSpotMarket]);

	// Size mode label (shows current unit)
	const sizeModeLabel = useMemo(() => {
		if (isSpotMarket) {
			if (side === "buy") {
				return sizeMode === "usd" ? spotBalance.quoteToken || "USDC" : baseToken || "---";
			}
			return sizeMode === "asset" ? baseToken || "---" : spotBalance.quoteToken || "USD";
		}
		return sizeMode === "asset" ? baseToken || "---" : "USD";
	}, [isSpotMarket, side, sizeMode, spotBalance.quoteToken, baseToken]);

	// Get size for a percentage of max
	// Returns a string in the current sizeMode unit (asset or usd)
	const getSizeForPercent = useCallback(
		(pct: number): string => {
			if (price <= 0) return "";

			if (isSpotMarket) {
				// SPOT MARKET
				if (side === "buy") {
					// Buying tokens with USDC
					// quoteAvailable = how much USDC we have
					// maxSize = how many tokens we can buy (quoteAvailable / price)
					if (sizeMode === "usd") {
						// Return USDC amount
						const usdAmount = (spotBalance.quoteAvailable * pct) / 100;
						return usdAmount.toFixed(2);
					}
					// Return token amount
					const tokenAmount = (maxSize * pct) / 100;
					return toStr(tokenAmount, szDecimals);
				}

				// Selling tokens for USDC
				// baseAvailable = how many tokens we have
				// maxSize = baseAvailable (floored)
				if (sizeMode === "usd") {
					// Return USDC equivalent
					const tokenAmount = (spotBalance.baseAvailable * pct) / 100;
					const usdAmount = tokenAmount * price;
					return usdAmount.toFixed(2);
				}
				// Return token amount
				const tokenAmount = (spotBalance.baseAvailable * pct) / 100;
				return toStr(tokenAmount, szDecimals);
			}

			// PERP MARKET
			if (maxSize <= 0) return "";
			const size = (maxSize * pct) / 100;

			if (sizeMode === "usd") {
				return (size * price).toFixed(2);
			}
			return toStr(size, szDecimals);
		},
		[maxSize, isSpotMarket, side, spotBalance.baseAvailable, spotBalance.quoteAvailable, szDecimals, sizeMode, price],
	);

	// Convert current size when toggling between asset/USD mode
	const convertSizeForModeToggle = useCallback((): string => {
		if (sizeValue <= 0 || price <= 0) return "";

		if (sizeMode === "asset") {
			// Converting to USD
			return (sizeValue * price).toFixed(2);
		}
		// Converting to asset
		return toStr(sizeValue, szDecimals);
	}, [sizeMode, sizeValue, price, szDecimals]);

	return {
		isConnected,
		isSpotMarket,
		baseToken,
		quoteToken,
		capabilities,
		szDecimals,
		availableBalance,
		availableBalanceToken,
		perpAvailable,
		spotBalance,
		maxSize,
		sizeValue,
		orderValue,
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
		maxTradeSzs,
		availableToBuy,
		availableToSell,
	};
}
