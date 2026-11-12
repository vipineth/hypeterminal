type PublicEnv = Record<string, string | undefined>;

export function getWalletConnectProjectId(env: PublicEnv = import.meta.env): string | undefined {
	return env.VITE_WALLET_CONNECT_PROJECT_ID?.trim() || undefined;
}
