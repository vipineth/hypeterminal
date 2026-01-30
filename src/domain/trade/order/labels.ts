import type { SizeMode } from "@/lib/trade/types";

export type { SizeMode };

export interface SideLabels {
	buy: string;
	sell: string;
	buyAria: string;
	sellAria: string;
}

export function getSideLabels(isSpotMarket: boolean): SideLabels {
	if (isSpotMarket) {
		return { buy: "Buy", sell: "Sell", buyAria: "Buy", sellAria: "Sell" };
	}
	return { buy: "Long", sell: "Short", buyAria: "Buy Long", sellAria: "Sell Short" };
}

export function getSizeModeLabel(sizeMode: SizeMode, baseToken: string, quoteToken: string): string {
	return sizeMode === "base" ? (baseToken || "---") : quoteToken;
}
