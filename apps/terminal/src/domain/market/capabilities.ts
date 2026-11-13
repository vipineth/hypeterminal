import type { Market } from "@/domain/market/model";

export interface MarketCapabilities {
	isLeveraged: boolean;
	hasMarginMode: boolean;
	hasFunding: boolean;
	hasTpSl: boolean;
	hasReduceOnly: boolean;
	maxLeverage: number;
	allowsCrossMargin: boolean;
	isOnlyIsolated: boolean;
	isCanonical: boolean | null;
}

export function getMarketCapabilities(market: Market | null | undefined): MarketCapabilities {
	if (!market) {
		return {
			isLeveraged: false,
			hasMarginMode: false,
			hasFunding: false,
			hasTpSl: false,
			hasReduceOnly: false,
			maxLeverage: 1,
			allowsCrossMargin: false,
			isOnlyIsolated: false,
			isCanonical: null,
		};
	}

	if (market.kind === "spot") {
		return {
			isLeveraged: false,
			hasMarginMode: false,
			hasFunding: false,
			hasTpSl: false,
			hasReduceOnly: false,
			maxLeverage: 1,
			allowsCrossMargin: false,
			isOnlyIsolated: false,
			isCanonical: market.isCanonical,
		};
	}

	return {
		isLeveraged: true,
		hasMarginMode: market.crossAllowed,
		hasFunding: true,
		hasTpSl: true,
		hasReduceOnly: true,
		maxLeverage: market.maxLeverage,
		allowsCrossMargin: market.crossAllowed,
		isOnlyIsolated: !market.crossAllowed,
		isCanonical: null,
	};
}
