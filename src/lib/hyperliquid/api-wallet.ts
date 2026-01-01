import { PrivateKeySigner } from "@nktkas/hyperliquid/signing";
import { bytesToHex } from "viem";

export function generateApiWalletPrivateKey(): `0x${string}` {
	if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
		throw new Error("Secure random generator unavailable.");
	}

	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return bytesToHex(bytes);
}

export function createApiWalletSigner(privateKey: `0x${string}`) {
	return new PrivateKeySigner(privateKey);
}

