import type { SpotBalanceData } from "@/lib/trade/balances";
import type { Side } from "@/lib/trade/types";

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

interface SizeModeLabelInput {
	isSpotMarket: boolean;
	side: Side;
	sizeMode: "asset" | "usd";
	baseToken: string;
	spotBalance: SpotBalanceData;
}

export function getSizeModeLabel(input: SizeModeLabelInput): string {
	const { isSpotMarket, side, sizeMode, baseToken, spotBalance } = input;

	if (isSpotMarket) {
		if (side === "buy") {
			return sizeMode === "usd" ? spotBalance.quoteToken || "USDC" : baseToken || "---";
		}
		return sizeMode === "asset" ? baseToken || "---" : spotBalance.quoteToken || "USD";
	}

	return sizeMode === "asset" ? baseToken || "---" : "USD";
}
