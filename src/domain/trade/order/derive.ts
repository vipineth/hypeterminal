import { getBaseQuoteFromDisplayName } from "@/domain/market";
import { getAvailableBalanceToken, getSpotBalanceData, type SpotBalanceData } from "@/domain/trade/balances";
import { getSideLabels, getSizeModeLabel, type SideLabels, type SizeMode } from "@/domain/trade/order/labels";
import { getMaxSizeForOrderEntry, getOrderValue, getSizeValueFromInput } from "@/domain/trade/order/size";
import type { SpotBalance } from "@/hooks/trade/use-account-balances";
import { getMarketCapabilities, type MarketCapabilities } from "@/lib/hyperliquid";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { Side } from "@/lib/trade/types";

export interface OrderEntryInputs {
	isConnected: boolean;
	market: UnifiedMarketInfo | undefined;
	side: Side;
	conversionPrice: number;
	sizeMode: SizeMode;
	sizeInput: string;
	spotBalances: SpotBalance[] | null | undefined;
	/** Max trade sizes in base token: [long, short] */
	maxTradeSzs: [number, number] | null;
	/** Available to trade in quote token: [long, short] */
	availableToTrade: [number, number] | null;
}

export interface OrderEntryDerived {
	isSpotMarket: boolean;
	baseToken: string;
	quoteToken: string;
	capabilities: MarketCapabilities;
	szDecimals: number;
	availableBalance: number;
	availableBalanceToken: string;
	spotBalance: SpotBalanceData;
	maxSize: number;
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
		? getBaseQuoteFromDisplayName(inputs.market.displayName, inputs.market.kind)
		: { baseToken: "", quoteToken: "" };
	const spotBalance = getSpotBalanceData(inputs.spotBalances, inputs.market);
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

	const sizeValue = getSizeValueFromInput({
		sizeInput: inputs.sizeInput,
		sizeMode: inputs.sizeMode,
		price: inputs.conversionPrice,
		szDecimals,
	});

	const orderValue = getOrderValue(sizeValue, inputs.conversionPrice);
	const sideLabels = getSideLabels(isSpotMarket);
	const sizeModeLabel = getSizeModeLabel(inputs.sizeMode, baseToken, quoteToken);

	return {
		isSpotMarket,
		baseToken,
		quoteToken,
		capabilities,
		szDecimals,
		availableBalance,
		availableBalanceToken,
		spotBalance,
		maxSize,
		sizeValue,
		orderValue,
		sideLabels,
		sizeModeLabel,
	};
}
