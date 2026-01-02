import { describe, expect, it, vi } from "vitest";
import { toHyperliquidWallet } from "./wallet";

const typedData = {
	domain: { name: "Test", version: "1", chainId: 1 },
	types: {
		EIP712Domain: [
			{ name: "name", type: "string" },
			{ name: "version", type: "string" },
			{ name: "chainId", type: "uint256" },
		],
		Mail: [{ name: "contents", type: "string" }],
	},
	primaryType: "Mail",
	message: { contents: "hello" },
};

describe("wallet", () => {
	it("returns null for invalid wallet client", () => {
		expect(toHyperliquidWallet(null)).toBeNull();
	});

	it("uses account address and request for signing", async () => {
		const accountAddress = "0x1111111111111111111111111111111111111111";
		const request = vi.fn().mockResolvedValue("0xsignature");
		const walletClient = {
			account: { address: accountAddress },
			getAddresses: vi.fn().mockResolvedValue([accountAddress]),
			getChainId: vi.fn().mockResolvedValue(1),
			request,
		};

		const wallet = toHyperliquidWallet(walletClient);
		expect(wallet).not.toBeNull();

		const addresses = await wallet?.getAddresses();
		expect(addresses).toEqual([accountAddress]);

		const chainId = await wallet?.getChainId();
		expect(chainId).toBe(1);

		const signature = await wallet?.signTypedData(typedData);
		expect(signature).toBe("0xsignature");
		expect(request).toHaveBeenCalledWith({
			method: "eth_signTypedData_v4",
			params: [accountAddress, expect.any(String)],
		});
	});

	it("falls back to request for chain id", async () => {
		const request = vi.fn().mockResolvedValue("0x1");
		const walletClient = {
			getAddresses: vi.fn().mockResolvedValue(["0x1111111111111111111111111111111111111111"]),
			request,
		};

		const wallet = toHyperliquidWallet(walletClient);
		const chainId = await wallet?.getChainId();
		expect(chainId).toBe(1);
		expect(request).toHaveBeenCalledWith({ method: "eth_chainId" });
	});
});
