import type { BuilderPerpMarket, PerpMarket, SpotMarket, UnifiedMarket } from "./hooks/useMarkets";

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

function isPerpOrBuilderPerp(market: UnifiedMarket): market is PerpMarket | BuilderPerpMarket {
	return market.kind === "perp" || market.kind === "builderPerp";
}

function isSpot(market: UnifiedMarket): market is SpotMarket {
	return market.kind === "spot";
}

function checkOnlyIsolated(market: PerpMarket | BuilderPerpMarket): boolean {
	return market.onlyIsolated === true || market.marginMode === "noCross" || market.marginMode === "strictIsolated";
}

export function getMarketCapabilities(market: UnifiedMarket | null | undefined): MarketCapabilities {
	if (!market) {
		return {
			isLeveraged: true,
			hasMarginMode: true,
			hasFunding: true,
			hasTpSl: true,
			hasReduceOnly: true,
			maxLeverage: 50,
			allowsCrossMargin: true,
			isOnlyIsolated: false,
			isCanonical: null,
		};
	}

	if (isSpot(market)) {
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

	if (isPerpOrBuilderPerp(market)) {
		const isOnlyIsolated = checkOnlyIsolated(market);
		return {
			isLeveraged: true,
			hasMarginMode: !isOnlyIsolated,
			hasFunding: true,
			hasTpSl: true,
			hasReduceOnly: true,
			maxLeverage: market.maxLeverage,
			allowsCrossMargin: !isOnlyIsolated,
			isOnlyIsolated,
			isCanonical: null,
		};
	}

	return {
		isLeveraged: true,
		hasMarginMode: true,
		hasFunding: true,
		hasTpSl: true,
		hasReduceOnly: true,
		maxLeverage: 50,
		allowsCrossMargin: true,
		isOnlyIsolated: false,
		isCanonical: null,
	};
}
