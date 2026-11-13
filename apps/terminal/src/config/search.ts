import type { UnifiedMarketInfo } from "@/lib/hyperliquid";
import type { SearchConfig } from "@/lib/search/types";

export const KIND_LABELS: Record<UnifiedMarketInfo["kind"], string> = {
	perp: "Perp",
	spot: "Spot",
	builderPerp: "Builder",
};

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
				return [m.base.name, m.base.displayName].filter(Boolean);
			},
			weight: 1.0,
		},
		baseTokenFullName: {
			extract: (m) => {
				if (m.kind !== "spot") return null;
				return m.base.fullName ?? null;
			},
			weight: 1.0,
		},
		quoteTokenName: {
			extract: (m) => {
				return m.kind === "perp" ? null : m.quote.name;
			},
			weight: 0.6,
		},
		quoteTokenFullName: {
			extract: (m) => {
				return m.kind === "spot" ? m.quote.fullName : null;
			},
			weight: 0.6,
		},
		dex: {
			extract: (m) => {
				if (m.kind !== "builderPerp") return null;
				return m.dex.name;
			},
			weight: 0.8,
		},
	},
	fuzzyMinLength: 3,
	fuzzyMaxDistance: 1,
};
