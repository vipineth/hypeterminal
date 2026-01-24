import { getMarketCapabilities, type MarketCapabilities } from "@/lib/hyperliquid";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import {
	getAvailableBalance,
	getAvailableBalanceToken,
	getPerpAvailable,
	getSpotBalanceData,
	type PerpSummaryLike,
	type SpotBalanceData,
	type SpotBalanceLike,
} from "@/domain/trade/balances";
import { getSideLabels, getSizeModeLabel, type SideLabels } from "@/domain/trade/order-entry/labels";
import { getMaxSizeForOrderEntry, getOrderValue, getSizeValueFromInput } from "@/domain/trade/order-entry/size";
import type { Side } from "@/lib/trade/types";

export interface OrderEntryInputs {
	isConnected: boolean;
	market: UnifiedMarketInfo | undefined;
	side: Side;
	conversionPrice: number;
	sizeMode: "asset" | "usd";
	sizeInput: string;
	spotBalances: SpotBalanceLike[] | null | undefined;
	perpSummary: PerpSummaryLike | null | undefined;
	maxTradeSzs: [number, number] | null;
	availableToBuy: number | null;
	availableToSell: number | null;
}

export interface OrderEntryDerived {
	isSpotMarket: boolean;
	baseToken: string;
	quoteToken: string;
	capabilities: MarketCapabilities;
	szDecimals: number;
	availableBalance: number;
	availableBalanceToken: string;
	perpAvailable: number;
	spotBalance: SpotBalanceData;
	maxSize: number;
	sizeValue: number;
	orderValue: number;
	sideLabels: SideLabels;
	sizeModeLabel: string;
}

export function deriveOrderEntry(inputs: OrderEntryInputs): OrderEntryDerived {
	const isSpotMarket = inputs.market?.kind === "spot";
	const capabilities = getMarketCapabilities(inputs.market);
	const szDecimals = inputs.market?.szDecimals ?? 0;

	const spotBalance = getSpotBalanceData(inputs.spotBalances, inputs.market);
	const baseToken = isSpotMarket ? spotBalance.baseToken : (inputs.market?.displayName?.split("-")[0] ?? "");
	const quoteToken = isSpotMarket ? spotBalance.quoteToken : "USD";

	const perpAvailable = getPerpAvailable(inputs.perpSummary?.accountValue, inputs.perpSummary?.totalMarginUsed);
	const availableBalance = getAvailableBalance(isSpotMarket, inputs.side, spotBalance, perpAvailable);
	const availableBalanceToken = getAvailableBalanceToken(isSpotMarket, inputs.side, spotBalance);

	const maxSize = getMaxSizeForOrderEntry({
		isConnected: inputs.isConnected,
		isSpotMarket,
		side: inputs.side,
		price: inputs.conversionPrice,
		spotBalance,
		szDecimals,
		maxTradeSzs: inputs.maxTradeSzs,
		availableToBuy: inputs.availableToBuy,
		availableToSell: inputs.availableToSell,
	});

	const sizeValue = getSizeValueFromInput({
		sizeInput: inputs.sizeInput,
		sizeMode: inputs.sizeMode,
		price: inputs.conversionPrice,
		szDecimals,
	});

	const orderValue = getOrderValue(sizeValue, inputs.conversionPrice);
	const sideLabels = getSideLabels(isSpotMarket);
	const sizeModeLabel = getSizeModeLabel({
		isSpotMarket,
		side: inputs.side,
		sizeMode: inputs.sizeMode,
		baseToken,
		spotBalance,
	});

	return {
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
	};
}
