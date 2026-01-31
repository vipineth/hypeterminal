const EXPLORER_BASE_URL = "https://app.hyperliquid.xyz/explorer";

export function getExplorerTxUrl(hash: string): string {
	return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

export function getExplorerTokenUrl(tokenId: string): string {
	return `${EXPLORER_BASE_URL}/token/${tokenId}`;
}
