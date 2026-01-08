import type { TradesWsEvent } from "@nktkas/hyperliquid";

export type RawTrade = TradesWsEvent[number];

export type ProcessedTrade = {
	id: string;
	hash: string;
	time: string;
	price: number;
	size: number;
	side: "buy" | "sell";
};

export function getTradeKey(hash: string, tid: number | string): string {
	return `${hash}:${tid}`;
}

export function processTrades(trades: RawTrade[]): ProcessedTrade[] {
	return trades.map((trade) => ({
		id: getTradeKey(trade.hash, trade.tid),
		hash: trade.hash,
		time: new Date(trade.time).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}),
		price: Number(trade.px),
		size: Number(trade.sz),
		side: trade.side === "B" ? "buy" : "sell",
	}));
}
