const EXPLORER_BASE_URL = "https://app.hyperliquid.xyz/explorer";

/**
 * Build Hyperliquid explorer URL for a transaction
 * @example getExplorerTxUrl("0x7f2c91...") -> "https://app.hyperliquid.xyz/explorer/tx/0x7f2c91..."
 */
export function getExplorerTxUrl(hash: string): string {
	return `${EXPLORER_BASE_URL}/tx/${hash}`;
}

/**
 * Build Hyperliquid explorer URL for an address
 * @example getExplorerAddressUrl("0x1234...") -> "https://app.hyperliquid.xyz/explorer/address/0x1234..."
 */
export function getExplorerAddressUrl(address: string): string {
	return `${EXPLORER_BASE_URL}/address/${address}`;
}

/**
 * Build Hyperliquid explorer URL for a token
 * @example getExplorerTokenUrl("0x8f254b...") -> "https://app.hyperliquid.xyz/explorer/token/0x8f254b..."
 */
export function getExplorerTokenUrl(tokenId: string): string {
	return `${EXPLORER_BASE_URL}/token/${tokenId}`;
}
