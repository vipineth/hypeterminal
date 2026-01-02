export function getTradeKey(hash: string, tradeId: number | string): string {
	return `${hash}:${tradeId}`;
}
