import type { AbstractViemLocalAccount } from "@nktkas/hyperliquid/signing";
import { bytesToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export function generateApiWalletPrivateKey(): `0x${string}` {
	if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
		throw new Error("Secure random generator unavailable.");
	}

	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return bytesToHex(bytes);
}

/**
 * Creates a signer from a private key using viem's privateKeyToAccount.
 * This implements the AbstractViemLocalAccount interface expected by the SDK.
 */
export function createApiWalletSigner(privateKey: `0x${string}`): AbstractViemLocalAccount {
	const account = privateKeyToAccount(privateKey);

	return {
		address: account.address,
		signTypedData: async (params: {
			domain: {
				name?: string;
				version?: string;
				chainId?: number;
				verifyingContract?: `0x${string}`;
				salt?: `0x${string}`;
			};
			types: {
				[key: string]: {
					name: string;
					type: string;
				}[];
			};
			primaryType: string;
			message: Record<string, unknown>;
		}): Promise<`0x${string}`> => {
			// Use viem's signTypedData which handles the EIP-712 signing correctly
			return account.signTypedData({
				domain: params.domain,
				types: params.types,
				primaryType: params.primaryType,
				message: params.message,
			});
		},
	};
}

