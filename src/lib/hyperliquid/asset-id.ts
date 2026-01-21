import type { MarketKind } from "./market-key";

export type ParsedAssetId =
	| { kind: "perp"; index: number }
	| { kind: "spot"; index: number }
	| { kind: "builderPerp"; dexIndex: number; index: number };

export function calculateAssetId(kind: MarketKind, index: number, dexIndex?: number): number {
	switch (kind) {
		case "perp":
			return index;
		case "spot":
			return 10000 + index;
		case "builderPerp":
			if (dexIndex === undefined) {
				throw new Error("dexIndex required for builderPerp");
			}
			return 100000 + dexIndex * 10000 + index;
	}
}

export function parseAssetId(assetId: number): ParsedAssetId {
	if (assetId >= 100000) {
		const adjusted = assetId - 100000;
		return {
			kind: "builderPerp",
			dexIndex: Math.floor(adjusted / 10000),
			index: adjusted % 10000,
		};
	}
	if (assetId >= 10000) {
		return { kind: "spot", index: assetId - 10000 };
	}
	return { kind: "perp", index: assetId };
}

export function isSpotAssetId(assetId: number): boolean {
	return assetId >= 10000 && assetId < 100000;
}

export function isPerpAssetId(assetId: number): boolean {
	return assetId >= 0 && assetId < 10000;
}

export function isBuilderPerpAssetId(assetId: number): boolean {
	return assetId >= 100000;
}

export function getAssetIdKind(assetId: number): MarketKind {
	if (isBuilderPerpAssetId(assetId)) return "builderPerp";
	if (isSpotAssetId(assetId)) return "spot";
	return "perp";
}
