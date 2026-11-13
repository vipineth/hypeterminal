import { formatPercent, formatToken, formatUSD } from "@/lib/format";

interface Args {
	size: string;
	szDecimals: number;
	coin: string;
	unrealizedPnl: number;
	roe: number;
}

export function buildClosePositionDescription({ size, szDecimals, coin, unrealizedPnl, roe }: Args): string {
	const sizeText = formatToken(size, { decimals: szDecimals, symbol: coin });
	const pnlText = formatUSD(unrealizedPnl, { signDisplay: "exceptZero" });
	const roeText = formatPercent(roe, 1);
	return `${sizeText} · ${pnlText} (${roeText})`;
}
