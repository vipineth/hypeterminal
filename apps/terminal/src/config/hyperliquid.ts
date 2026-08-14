import type { BuilderConfig } from "@/lib/hyperliquid";

type PublicEnv = Record<string, string | undefined>;

const BUILDER_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const MAX_FEE_TENTH_BPS = 1000;

export function parseBuilderConfig(env: PublicEnv = import.meta.env): BuilderConfig {
	const address = env.VITE_BUILDER_ADDRESS?.trim();
	const fee = env.VITE_BUILDER_FEE_TENTH_BPS?.trim();
	if (!address && !fee) return undefined;
	if (!address || !BUILDER_ADDRESS_PATTERN.test(address)) return warnDisabled();
	if (!fee || !/^\d+$/.test(fee) || Number(fee) > MAX_FEE_TENTH_BPS) return warnDisabled();
	return { b: address as `0x${string}`, f: Number(fee) };
}

function warnDisabled(): undefined {
	if (import.meta.env.DEV) {
		console.warn("Invalid or incomplete VITE_BUILDER_ADDRESS / VITE_BUILDER_FEE_TENTH_BPS; builder fee disabled");
	}
	return undefined;
}

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = parseBuilderConfig();
