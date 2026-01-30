import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import {
	getAvailableBalance,
	getAvailableBalanceToken,
	getPerpAvailable,
	getSpotBalanceData,
	type PerpSummaryLike,
	type SpotBalanceData,
	type SpotBalanceLike,
} from "@/domain/trade/balances";
import { getSideLabels, getSizeModeLabel, type SideLabels } from "@/domain/trade/order/labels";
import { getMaxSizeForOrderEntry, getOrderValue, getSizeValueFromInput } from "@/domain/trade/order/size";
import { getMarketCapabilities, type MarketCapabilities } from "@/lib/hyperliquid";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side } from "@/lib/trade/types";

function getBaseTokenDisplayName(market: UnifiedMarketInfo | undefined): string {
	if (!market) return "";
	if (market.kind === "spot") {
		const token = market.tokensInfo?.[0];
		return token?.displayName ?? token?.name ?? "";
	}

	return market.name;
}

function getQuoteTokenDisplayName(market: UnifiedMarketInfo | undefined): string {
	if (!market) return DEFAULT_QUOTE_TOKEN;
	if (market.kind === "spot") {
		const token = market.tokensInfo?.[1];
		return token?.displayName ?? token?.name ?? DEFAULT_QUOTE_TOKEN;
	}
	if (market.kind === "builderPerp") {
		return market.quoteToken?.displayName ?? market.quoteToken?.name ?? DEFAULT_QUOTE_TOKEN;
	}
	return DEFAULT_QUOTE_TOKEN;
}

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
	const baseToken = getBaseTokenDisplayName(inputs.market);
	const quoteToken = getQuoteTokenDisplayName(inputs.market);
	const perpAvailable = getPerpAvailable(inputs.perpSummary?.accountValue, inputs.perpSummary?.totalMarginUsed);
	const availableBalance = getAvailableBalance(inputs.market, inputs.side, spotBalance, perpAvailable);
	const availableBalanceToken = getAvailableBalanceToken(inputs.market, inputs.side);

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
		quoteToken,
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
