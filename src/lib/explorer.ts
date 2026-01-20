import type { Chain } from "viem";
import { arbitrum } from "viem/chains";

type ExplorerType = "tx" | "address" | "token" | "block";

function getExplorerBaseUrl(chain: Chain): string | null {
	return chain.blockExplorers?.default?.url ?? null;
}

function buildExplorerUrl(chain: Chain, type: ExplorerType, value: string): string | null {
	const baseUrl = getExplorerBaseUrl(chain);
	if (!baseUrl) return null;
	return `${baseUrl}/${type}/${value}`;
}

export function getExplorerTxUrl(hash: string, chain: Chain = arbitrum): string | null {
	return buildExplorerUrl(chain, "tx", hash);
}

export function getExplorerAddressUrl(address: string, chain: Chain = arbitrum): string | null {
	return buildExplorerUrl(chain, "address", address);
}

export function getExplorerTokenUrl(address: string, chain: Chain = arbitrum): string | null {
	return buildExplorerUrl(chain, "token", address);
}

export function getExplorerBlockUrl(blockNumber: string | number, chain: Chain = arbitrum): string | null {
	return buildExplorerUrl(chain, "block", String(blockNumber));
}
