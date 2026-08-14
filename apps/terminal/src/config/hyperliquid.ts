import type { BuilderConfig } from "@/lib/hyperliquid";

type PublicEnv = Record<string, string | undefined>;

const BUILDER_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const BUILDER_FEE_BPS_PATTERN = /^\d+(\.\d)?$/;
const MAX_FEE_BPS = 100;

export function parseBuilderConfig(env: PublicEnv = import.meta.env): BuilderConfig {
	const address = env.VITE_BUILDER_ADDRESS?.trim();
	const bps = env.VITE_BUILDER_FEE_BPS?.trim();
	if (!address && !bps) return undefined;
	if (!address || !BUILDER_ADDRESS_PATTERN.test(address)) return warnDisabled();
	if (!bps || !BUILDER_FEE_BPS_PATTERN.test(bps) || Number(bps) > MAX_FEE_BPS) return warnDisabled();
	return { b: address as `0x${string}`, f: Math.round(Number(bps) * 10) };
}

function warnDisabled(): undefined {
	if (import.meta.env.DEV) {
		console.warn("Invalid or incomplete VITE_BUILDER_ADDRESS / VITE_BUILDER_FEE_BPS; builder fee disabled");
	}
	return undefined;
}

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = parseBuilderConfig();
