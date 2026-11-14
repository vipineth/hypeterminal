import type { Market } from "@/domain/market/model";

export interface FeeRates {
	takerRate: number;
	makerRate: number;
}

const MAX_DEPLOYER_FEE_SCALE = 3;
const MAX_GROWTH_MODE_DEPLOYER_FEE_SCALE = 10;
const GROWTH_MODE_FEE_SCALE = 0.1;

function getDeployerFeeMultiplier(deployerFeeScale: number): number {
	return deployerFeeScale < 1 ? deployerFeeScale + 1 : deployerFeeScale * 2;
}

export function getMarketFeeRates(userRates: FeeRates, market: Market | undefined): FeeRates {
	if (market?.kind !== "builderPerp") return userRates;
	const growth = market.growthMode ? GROWTH_MODE_FEE_SCALE : 1;
	const maxScale = market.growthMode ? MAX_GROWTH_MODE_DEPLOYER_FEE_SCALE : MAX_DEPLOYER_FEE_SCALE;
	const scale = getDeployerFeeMultiplier(market.deployerFeeScale ?? maxScale) * growth;
	return {
		takerRate: userRates.takerRate * scale,
		makerRate: userRates.makerRate > 0 ? userRates.makerRate * scale : userRates.makerRate * growth,
	};
}
