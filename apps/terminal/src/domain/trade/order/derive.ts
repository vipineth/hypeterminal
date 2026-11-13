import { getSideLabels, getSizeModeLabel, type SideLabels } from "@/config/ui-text";
import { getBaseQuoteFromPairName } from "@/domain/market";
import { getMarketCapabilities, type MarketCapabilities } from "@/domain/market/capabilities";
import {
	getAvailableBalanceToken,
	getSpotBalanceData,
	type SpotAvailableAfterMaintenance,
	type SpotBalanceData,
} from "@/domain/trade/balances";
import {
	getMaxSizeForOrderEntry,
	getOrderValue,
	getSizeFromInput,
	getSizeUnit,
	QUOTE_SIZE_DECIMALS,
	readSizeInput,
} from "@/domain/trade/order/size";
import type { SpotBalance } from "@/hooks/trade/use-account-balances";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side, SizeMode, SizeUnit } from "@/lib/trade/types";

export interface OrderEntryInputs {
	isConnected: boolean;
	market: UnifiedMarketInfo | undefined;
	side: Side;
	conversionPrice: number;
	sizeMode: SizeMode;
	size: string;
	sizeUnit: SizeUnit | null;
	spotBalances: SpotBalance[] | null | undefined;
	spotAvailableAfterMaintenance?: SpotAvailableAfterMaintenance | null;
	/** Max trade sizes in base token: [long, short] */
	maxTradeSzs: [number, number] | null;
	/** Available to trade in quote token: [long, short] */
	availableToTrade: [number, number] | null;
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
	spotBalance: SpotBalanceData;
	maxSize: number;
	orderSize: string;
	sizeValue: number;
	orderValue: number;
	sideLabels: SideLabels;
	sizeModeLabel: string;
}

function getAvailableBalance(
	isSpotMarket: boolean,
	isBuy: boolean,
	spotBalance: SpotBalanceData,
	availableLong: number,
	availableShort: number,
): number {
	if (isSpotMarket) {
		return isBuy ? spotBalance.quoteAvailable : spotBalance.baseAvailable;
	}
	return isBuy ? availableLong : availableShort;
}

export function deriveOrderEntry(inputs: OrderEntryInputs): OrderEntryDerived {
	const isSpotMarket = inputs.market?.kind === "spot";
	const isBuy = inputs.side === "buy";
	const capabilities = getMarketCapabilities(inputs.market);
	const szDecimals = inputs.market?.szDecimals ?? 0;

	const { baseToken, quoteToken } = inputs.market
		? getBaseQuoteFromPairName(inputs.market.pairName, inputs.market.kind)
		: { baseToken: "", quoteToken: "" };
	const assetLabel = inputs.market?.kind === "builderPerp" ? inputs.market.name : baseToken;
	const spotBalance = getSpotBalanceData(inputs.spotBalances, inputs.market, inputs.spotAvailableAfterMaintenance);
	const availableBalanceToken = getAvailableBalanceToken(inputs.market, inputs.side);

	const [availableLong, availableShort] = inputs.availableToTrade ?? [0, 0];
	const availableBalance = getAvailableBalance(isSpotMarket, isBuy, spotBalance, availableLong, availableShort);

	const maxSize = getMaxSizeForOrderEntry({
		isConnected: inputs.isConnected,
		isSpotMarket,
		side: inputs.side,
		price: inputs.conversionPrice,
		spotBalance,
		szDecimals,
		maxTradeSzs: inputs.maxTradeSzs,
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
		spotBalance,
		maxSize,
		orderSize,
		sizeValue,
		orderValue,
		sideLabels,
		sizeModeLabel,
	};
}
