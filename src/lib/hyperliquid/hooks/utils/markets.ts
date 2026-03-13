import type { MarketKind } from "@/domain/market";

export function getMarketKindFromName(name: string): MarketKind {
	if (name.includes(":")) return "builderPerp";
	if (name.startsWith("@")) return "spot";
	return "perp";
}
