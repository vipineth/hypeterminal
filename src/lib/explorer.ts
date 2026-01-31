import type { Chain } from "viem";
import { arbitrum } from "viem/chains";

function getExplorerBaseUrl(chain: Chain): string | null {
	return chain.blockExplorers?.default?.url ?? null;
}

export function getExplorerTxUrl(hash: string, chain: Chain = arbitrum): string | null {
	const baseUrl = getExplorerBaseUrl(chain);
	if (!baseUrl) return null;
	return `${baseUrl}/tx/${hash}`;
}
