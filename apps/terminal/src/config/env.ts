type PublicEnv = Record<string, string | undefined>;

export function getWalletConnectProjectId(env: PublicEnv = import.meta.env): string | undefined {
	return env.VITE_WALLET_CONNECT_PROJECT_ID?.trim() || undefined;
}

export function isHyperliquidTestnet(env: PublicEnv = import.meta.env): boolean {
	return env.VITE_HYPERLIQUID_TESTNET === "true";
}

export function isPerfEnabled(env: PublicEnv = import.meta.env): boolean {
	return env.VITE_PERF_ENABLED === "true";
}
