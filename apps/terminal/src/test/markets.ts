import type { MetaResponse, SpotMetaResponse } from "@nktkas/hyperliquid";
import {
	isListed,
	isPerpLike,
	type ListedMarket,
	type MetaPayloads,
	type PerpLikeMarket,
	parseMarkets,
	type SpotMarket,
} from "@/domain/market/model";

type SdkToken = SpotMetaResponse["tokens"][number];

function token(index: number, name: string, szDecimals: number): SdkToken {
	return {
		name,
		szDecimals,
		weiDecimals: 8,
		index,
		tokenId: `0x${index.toString(16).padStart(32, "0")}`,
		isCanonical: true,
		evmContract: null,
		fullName: null,
		deployerTradingFeeShare: "0.0",
	};
}

const USDC = token(0, "USDC", 8);

function parseOne(payloads: MetaPayloads, name: string) {
	const market = parseMarkets(payloads).byName.get(name);
	if (!market || !isListed(market)) throw new Error(`test market ${name} did not parse`);
	return market;
}

export function perpMarket(assetId: number, szDecimals: number, name = "TEST"): ListedMarket & PerpLikeMarket {
	const universe = Array.from({ length: assetId + 1 }, (_, position) => ({
		name: position === assetId ? name : `FILLER${position}`,
		szDecimals,
		maxLeverage: 50,
		marginTableId: 50,
	}));
	const market = parseOne(
		{
			perpDexs: [null],
			allPerpMetas: [{ universe, marginTables: [], collateralToken: 0 } as MetaResponse],
			spotMeta: { tokens: [USDC], universe: [] },
		},
		name,
	);
	if (!isPerpLike(market)) throw new Error(`test market ${name} is not a perp`);
	return market;
}

export function spotMarket(assetId: number, szDecimals: number, base = "BASE"): SpotMarket {
	const index = assetId - 10000;
	const market = parseOne(
		{
			perpDexs: [],
			allPerpMetas: [],
			spotMeta: {
				tokens: [USDC, token(1, base, szDecimals)],
				universe: [{ name: `@${index}`, tokens: [1, 0], index, isCanonical: false }],
			},
		},
		`@${index}`,
	);
	if (market.kind !== "spot") throw new Error(`test market @${index} is not spot`);
	return market;
}
