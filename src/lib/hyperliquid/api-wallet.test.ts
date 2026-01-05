import { describe, expect, it } from "vitest";
import { generatePrivateKey } from "./api-wallet";

describe("api-wallet", () => {
	it("re-exports generatePrivateKey from viem", () => {
		const key = generatePrivateKey();
		expect(key).toMatch(/^0x[0-9a-f]{64}$/);
	});
});
