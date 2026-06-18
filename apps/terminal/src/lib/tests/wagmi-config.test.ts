import { describe, expect, it, vi } from "vitest";
import { arbitrum, mainnet } from "wagmi/chains";
import { getWalletConnectProjectId } from "@/config/env";
import { getBridgeRpcUrl } from "@/config/wagmi";

vi.mock("wagmi/connectors", async (importOriginal) => {
	const actual = await importOriginal<typeof import("wagmi/connectors")>();
	return {
		...actual,
		walletConnect: vi.fn(actual.walletConnect),
	};
});

describe("wagmi config", () => {
	it("uses a browser-safe Ethereum RPC by default", () => {
		expect(getBridgeRpcUrl(mainnet, {})).toBe("https://ethereum-rpc.publicnode.com");
	});

	it("allows overriding the Ethereum RPC URL", () => {
		expect(getBridgeRpcUrl(mainnet, { VITE_ETHEREUM_RPC_URL: "http://localhost:8545" })).toBe("http://localhost:8545");
	});

	it("leaves non-overridden bridge chains on their chain defaults", () => {
		expect(getBridgeRpcUrl(arbitrum, {})).toBeUndefined();
	});
});

describe("getWalletConnectProjectId", () => {
	it("returns undefined for missing project ID", () => {
		expect(getWalletConnectProjectId({})).toBeUndefined();
	});

	it("returns undefined for blank project ID", () => {
		expect(getWalletConnectProjectId({ VITE_WALLET_CONNECT_PROJECT_ID: "  " })).toBeUndefined();
	});

	it("returns undefined for empty string project ID", () => {
		expect(getWalletConnectProjectId({ VITE_WALLET_CONNECT_PROJECT_ID: "" })).toBeUndefined();
	});

	it("trims and returns a valid project ID", () => {
		expect(getWalletConnectProjectId({ VITE_WALLET_CONNECT_PROJECT_ID: "  abc123  " })).toBe("abc123");
	});

	it("returns a non-blank project ID unchanged", () => {
		expect(getWalletConnectProjectId({ VITE_WALLET_CONNECT_PROJECT_ID: "my-project-id" })).toBe("my-project-id");
	});
});

describe("createWagmiConfig", () => {
	it("does not create a WalletConnect connector when project ID is missing", async () => {
		const { walletConnect } = await import("wagmi/connectors");
		const { createWagmiConfig } = await import("@/config/wagmi");
		vi.mocked(walletConnect).mockClear();
		createWagmiConfig({ env: {} });
		expect(walletConnect).not.toHaveBeenCalled();
	});

	it("creates a WalletConnect connector with the project ID and showQrModal false", async () => {
		const { walletConnect } = await import("wagmi/connectors");
		const { createWagmiConfig } = await import("@/config/wagmi");
		vi.mocked(walletConnect).mockClear();
		createWagmiConfig({ env: { VITE_WALLET_CONNECT_PROJECT_ID: "abc" } });
		expect(walletConnect).toHaveBeenCalledWith(expect.objectContaining({ projectId: "abc", showQrModal: false }));
	});
});
