export type Env = Record<string, string | undefined>;

const DIRECT_READ_RPCS = [
	{ chainId: 1, envKey: "VITE_ETHEREUM_RPC_URL", defaultUrl: "https://ethereum-rpc.publicnode.com" },
	{ chainId: 42161, envKey: "VITE_ARBITRUM_RPC_URL", defaultUrl: "https://arbitrum-one-rpc.publicnode.com" },
] as const;

type DirectReadRpc = (typeof DIRECT_READ_RPCS)[number];

function resolveUrl(rpc: DirectReadRpc, env: Env): string {
	return env[rpc.envKey] || rpc.defaultUrl;
}

export function getRpcUrl(chainId: number, env: Env): string | undefined {
	const rpc = DIRECT_READ_RPCS.find((entry) => entry.chainId === chainId);
	return rpc && resolveUrl(rpc, env);
}

export function getRpcOrigins(env: Env): string[] {
	return DIRECT_READ_RPCS.map((rpc) => new URL(resolveUrl(rpc, env)).origin);
}
