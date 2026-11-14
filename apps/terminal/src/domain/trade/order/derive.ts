import { getSideLabels, getSizeModeLabel, type SideLabels } from "@/config/ui-text";
import { getBaseQuoteFromPairName } from "@/domain/market";
import { getMarketCapabilities, type MarketCapabilities } from "@/domain/market/capabilities";
import type { Market } from "@/domain/market/model";
import type { Collateral, Shortfall } from "@/domain/trade/account-mode";
import type { SpotBalanceData } from "@/domain/trade/balances";
import {
	getMaxSizeForOrderEntry,
	getOrderValue,
	getSizeFromInput,
	getSizeUnit,
	QUOTE_SIZE_DECIMALS,
	readSizeInput,
} from "@/domain/trade/order/size";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { toNumberOrZero } from "@/lib/trade/numbers";
import type { Side, SizeMode, SizeUnit } from "@/lib/trade/types";

export interface OrderEntryInputs {
	isConnected: boolean;
	market: UnifiedMarketInfo | undefined;
	side: Side;
	conversionPrice: number;
	sizeMode: SizeMode;
	size: string;
	sizeUnit: SizeUnit | null;
	collateral: Collateral;
}

export interface OrderEntryDerived {
	isSpotMarket: boolean;
	baseToken: string;
	assetLabel: string;
	quoteToken: string;
	capabilities: MarketCapabilities;
	szDecimals: number;
	sizeInput: string;
	sizeInputDecimals: number;
	availableBalance: number;
	availableBalanceToken: string;
	collateral: Collateral;
	shortfall: Shortfall | null;
	spotBalance: SpotBalanceData;
	maxSize: number;
	orderSize: string;
	sizeValue: number;
	orderValue: number;
	sideLabels: SideLabels;
	sizeModeLabel: string;
}

function getSpotBalance(
	market: UnifiedMarketInfo | undefined,
	side: Side,
	available: number,
	quoteToken: string,
): SpotBalanceData {
	if (market?.kind !== "spot") return { baseAvailable: 0, quoteAvailable: 0, baseName: "", quoteName: quoteToken };
	return {
		baseAvailable: side === "sell" ? available : 0,
		quoteAvailable: side === "buy" ? available : 0,
		baseName: market.base.name,
		quoteName: market.quote.name,
	};
}

export function getAssetLabel(market: Pick<Market, "kind" | "name"> | undefined, baseToken: string): string {
	return market?.kind === "builderPerp" ? market.name : baseToken;
}

export function deriveOrderEntry(inputs: OrderEntryInputs): OrderEntryDerived {
	const isSpotMarket = inputs.market?.kind === "spot";
	const capabilities = getMarketCapabilities(inputs.market);
	const szDecimals = inputs.market?.szDecimals ?? 0;

	const { baseToken, quoteToken } = inputs.market
		? getBaseQuoteFromPairName(inputs.market.pairName, inputs.market.kind)
		: { baseToken: "", quoteToken: "" };
	const assetLabel = getAssetLabel(inputs.market, baseToken);
	const { collateral } = inputs;
	const isReady = collateral.status === "ready";
	const availableBalance = isReady ? toNumberOrZero(collateral.available) : 0;
	const availableBalanceToken = isReady ? collateral.token.displayName : (inputs.market?.quote.displayName ?? quoteToken);
	const spotBalance = getSpotBalance(inputs.market, inputs.side, availableBalance, quoteToken);

	const maxSize = getMaxSizeForOrderEntry({
		isConnected: inputs.isConnected,
		isSpotMarket,
		side: inputs.side,
		price: inputs.conversionPrice,
		spotBalance,
		szDecimals,
		perpMaxSize: isReady ? toNumberOrZero(collateral.maxSize) : 0,
	});

	const sizeInput = readSizeInput(inputs.size, inputs.sizeUnit, getSizeUnit(inputs.market, inputs.sizeMode));
	const orderSize = getSizeFromInput({
		sizeInput,
		sizeMode: inputs.sizeMode,
		price: inputs.conversionPrice,
		szDecimals,
	});
	const sizeValue = Number(orderSize);

	const orderValue = getOrderValue(sizeValue, inputs.conversionPrice);
	const sideLabels = getSideLabels(isSpotMarket);
	const sizeModeLabel = getSizeModeLabel(inputs.sizeMode, baseToken, quoteToken);
	const sizeInputDecimals = inputs.sizeMode === "quote" ? QUOTE_SIZE_DECIMALS : szDecimals;

	return {
		isSpotMarket,
		baseToken,
		assetLabel,
		quoteToken,
		capabilities,
		szDecimals,
		sizeInput,
		sizeInputDecimals,
		availableBalance,
		availableBalanceToken,
		collateral,
		shortfall: isReady ? collateral.shortfall : null,
		spotBalance,
		maxSize,
		orderSize,
		sizeValue,
		orderValue,
		sideLabels,
		sizeModeLabel,
	};
}
