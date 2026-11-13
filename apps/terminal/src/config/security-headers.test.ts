import { arbitrum, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import { getRpcUrl } from "./rpc";
import { createSecurityHeaders } from "./security-headers";

const DIRECT_READ_CHAINS = [mainnet, arbitrum];

function connectSrcOf(env: Record<string, string | undefined>): string[] {
	const policy = createSecurityHeaders(env)["content-security-policy"];
	const directive = policy.split("; ").find((entry) => entry.startsWith("connect-src "));
	return directive?.split(" ").slice(1) ?? [];
}

function transportOrigin(chain: (typeof DIRECT_READ_CHAINS)[number], env: Record<string, string | undefined>) {
	return new URL(getRpcUrl(chain.id, env) ?? chain.rpcUrls.default.http[0]).origin;
}

describe("connect-src covers every RPC the app reads directly", () => {
	it.each(DIRECT_READ_CHAINS)("allows the default $name RPC", (chain) => {
		expect(connectSrcOf({})).toContain(transportOrigin(chain, {}));
	});

	it.each(DIRECT_READ_CHAINS)("allows an env-overridden $name RPC", (chain) => {
		const env = {
			VITE_ETHEREUM_RPC_URL: "https://eth.example-rpc.com/v1/key",
			VITE_ARBITRUM_RPC_URL: "https://arb.example-rpc.com/v1/key",
		};
		const origin = transportOrigin(chain, env);
		expect(origin).toMatch(/example-rpc\.com$/);
		expect(connectSrcOf(env)).toContain(origin);
	});

	it("never leaks an RPC path or key into the header", () => {
		const env = { VITE_ARBITRUM_RPC_URL: "https://arb.example-rpc.com/v1/secret-key" };
		expect(createSecurityHeaders(env)["content-security-policy"]).not.toContain("secret-key");
	});
});
