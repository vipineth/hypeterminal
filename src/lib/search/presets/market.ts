import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import type { SearchConfig } from "../types";

export const marketSearchConfig: SearchConfig<UnifiedMarketInfo> = {
	fields: {
		baseCoin: {
			extract: (m) => m.shortName,
			weight: 2.0,
			fuzzy: true,
		},
		pairName: {
			extract: (m) => m.pairName,
			weight: 1.5,
		},
		name: {
			extract: (m) => {
				if (m.kind === "spot") return null;
				return m.name;
			},
			weight: 1.2,
		},
		baseTokenName: {
			extract: (m) => {
				if (m.kind !== "spot") return null;
				const token = m.tokensInfo[0];
				return token ? [token.name, token.displayName].filter(Boolean) : null;
			},
			weight: 1.0,
		},
		baseTokenFullName: {
			extract: (m) => {
				if (m.kind !== "spot") return null;
				return m.tokensInfo[0]?.fullName ?? null;
			},
			weight: 1.0,
		},
		quoteTokenName: {
			extract: (m) => {
				if (m.kind === "spot") return m.tokensInfo[1]?.name ?? null;
				if (m.kind === "builderPerp") return m.quoteToken?.name ?? null;
				return null;
			},
			weight: 0.6,
		},
		quoteTokenFullName: {
			extract: (m) => {
				if (m.kind === "spot") return m.tokensInfo[1]?.fullName ?? null;
				if (m.kind === "builderPerp") return m.quoteToken?.fullName ?? null;
				return null;
			},
			weight: 0.6,
		},
		dex: {
			extract: (m) => {
				if (m.kind !== "builderPerp") return null;
				return m.dex;
			},
			weight: 0.8,
		},
	},
	fuzzyMinLength: 3,
	fuzzyMaxDistance: 2,
};
