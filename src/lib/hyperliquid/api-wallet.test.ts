import { webcrypto } from "crypto";
import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { createApiWalletSigner, generateApiWalletPrivateKey } from "./api-wallet";

const typedData = {
	domain: { name: "Hype", version: "1", chainId: 1 },
	types: { Mail: [{ name: "contents", type: "string" }] },
	primaryType: "Mail",
	message: { contents: "hello" },
};

let originalCrypto: Crypto | undefined;
let didStubCrypto = false;

beforeEach(() => {
	originalCrypto = globalThis.crypto;
	if (!globalThis.crypto) {
		Object.defineProperty(globalThis, "crypto", {
			value: webcrypto as unknown as Crypto,
			configurable: true,
		});
		didStubCrypto = true;
	}
});

afterEach(() => {
	if (!didStubCrypto) return;

	if (originalCrypto) {
		Object.defineProperty(globalThis, "crypto", {
			value: originalCrypto,
			configurable: true,
		});
	} else {
		const globalWithCrypto = globalThis as { crypto?: Crypto };
		delete globalWithCrypto.crypto;
	}

	didStubCrypto = false;
});

describe("api-wallet", () => {
	it("generates a private key", () => {
		const key = generateApiWalletPrivateKey();
		expect(key).toMatch(/^0x[0-9a-f]{64}$/);
	});

	it("creates a signer matching the derived account", async () => {
		const privateKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
		const signer = createApiWalletSigner(privateKey);
		const account = privateKeyToAccount(privateKey);

		expect(signer.address).toBe(account.address);

		const signature = await signer.signTypedData(typedData);
		expect(signature).toMatch(/^0x[0-9a-f]+$/);
	});
});
