import type { AbstractViemLocalAccount } from "@nktkas/hyperliquid/signing";
import { describe, expect, it, vi } from "vitest";
import { toHyperliquidWallet } from "./wallet";

const typedData = {
	domain: { name: "Test", version: "1", chainId: 1 },
	types: {
		Mail: [{ name: "contents", type: "string" }],
	},
	primaryType: "Mail",
	message: { contents: "hello" },
};

describe("wallet", () => {
	it("returns null for invalid wallet client", () => {
		expect(toHyperliquidWallet(null)).toBeNull();
		expect(toHyperliquidWallet({})).toBeNull();
		expect(toHyperliquidWallet({ signTypedData: "not a function" })).toBeNull();
	});

	it("returns null if no account address and no override", () => {
		const walletClient = {
			signTypedData: vi.fn(),
		};
		expect(toHyperliquidWallet(walletClient)).toBeNull();
	});

	it("creates wallet adapter with accountOverride when client.account is missing", async () => {
		const accountAddress = "0x1111111111111111111111111111111111111111" as const;
		const signTypedData = vi.fn().mockResolvedValue("0xsignature");
		const walletClient = {
			signTypedData,
		};

		const wallet = toHyperliquidWallet(walletClient, accountAddress) as AbstractViemLocalAccount | null;
		expect(wallet).not.toBeNull();
		expect(wallet?.address).toBe(accountAddress);

		const signature = await wallet?.signTypedData(typedData);
		expect(signature).toBe("0xsignature");
		expect(signTypedData).toHaveBeenCalledWith({
			account: accountAddress,
			domain: typedData.domain,
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
		});
	});

	it("creates wallet adapter from valid wallet client", async () => {
		const accountAddress = "0x1111111111111111111111111111111111111111" as const;
		const signTypedData = vi.fn().mockResolvedValue("0xsignature");
		const walletClient = {
			account: { address: accountAddress },
			signTypedData,
		};

		const wallet = toHyperliquidWallet(walletClient) as AbstractViemLocalAccount | null;
		expect(wallet).not.toBeNull();
		expect(wallet?.address).toBe(accountAddress);

		const signature = await wallet?.signTypedData(typedData);
		expect(signature).toBe("0xsignature");
		expect(signTypedData).toHaveBeenCalledWith({
			account: walletClient.account,
			domain: typedData.domain,
			types: typedData.types,
			primaryType: typedData.primaryType,
			message: typedData.message,
		});
	});
});
