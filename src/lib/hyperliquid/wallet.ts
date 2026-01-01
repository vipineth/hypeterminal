import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import { hashTypedData, serializeTypedData, type WalletClient } from "viem";

type WalletClientLike = Pick<WalletClient, "account" | "getAddresses" | "getChainId" | "request">;

function isWalletClientLike(value: unknown): value is WalletClientLike {
	if (!value || typeof value !== "object") return false;
	return "request" in value || "getAddresses" in value || "getChainId" in value;
}

export function toHyperliquidWallet(walletClient: unknown): AbstractWallet | null {
	if (!isWalletClientLike(walletClient)) return null;

	const client = walletClient;

	const getAddresses = async (): Promise<`0x${string}`[]> => {
		const accountAddress =
			typeof client.account === "object" && client.account && "address" in client.account ? client.account.address : undefined;
		if (typeof accountAddress === "string" && accountAddress.startsWith("0x")) return [accountAddress as `0x${string}`];

		const addresses = (await client.getAddresses?.()) ?? [];
		return [...addresses] as `0x${string}`[];
	};

	const getChainId = async (): Promise<number> => {
		if (client.getChainId) return await client.getChainId();
		if (!client.request) throw new Error("Wallet provider unavailable.");

		const chainIdHex = await client.request({ method: "eth_chainId" });
		if (typeof chainIdHex === "string" && chainIdHex.startsWith("0x")) return Number.parseInt(chainIdHex, 16);
		throw new Error("Wallet chain ID unavailable.");
	};

	const signTypedData = async (params: {
		domain: Record<string, unknown>;
		types: Record<string, Array<{ name: string; type: string }>>;
		primaryType: string;
		message: Record<string, unknown>;
	}): Promise<`0x${string}`> => {
		const addresses = await getAddresses();
		const address = addresses[0];
		if (!address) throw new Error("Wallet account unavailable.");
		if (!client.request) throw new Error("Wallet provider unavailable.");

		const payloadObject = {
			types: params.types,
			domain: params.domain,
			primaryType: params.primaryType,
			message: params.message,
		};
		const payloadString = serializeTypedData({
			domain: params.domain as never,
			types: params.types as never,
			primaryType: params.primaryType as never,
			message: params.message as never,
		});

		const attempts: Array<{ method: string; params: unknown[] }> = [
			{ method: "eth_signTypedData_v4", params: [address, payloadString] },
			{ method: "eth_signTypedData_v4", params: [address, payloadObject] },
			{ method: "eth_signTypedData_v3", params: [address, payloadString] },
			{ method: "eth_signTypedData_v3", params: [address, payloadObject] },
			{ method: "eth_signTypedData", params: [address, payloadString] },
			{ method: "eth_signTypedData", params: [payloadString, address] },
			{ method: "eth_signTypedData", params: [address, payloadObject] },
			{ method: "eth_signTypedData", params: [payloadObject, address] },
		];

		let lastError: unknown = null;
		for (const attempt of attempts) {
			try {
				const sig = await client.request({ method: attempt.method, params: attempt.params });
				if (typeof sig === "string" && sig.startsWith("0x")) return sig as `0x${string}`;
				throw new Error("Unexpected signature response.");
			} catch (err) {
				lastError = err;
			}
		}

		try {
			const digest = hashTypedData({
				domain: params.domain as never,
				types: params.types as never,
				primaryType: params.primaryType as never,
				message: params.message as never,
			});

			const ethSignAttempts: Array<{ method: string; params: unknown[] }> = [
				{ method: "eth_sign", params: [address, digest] },
				{ method: "eth_sign", params: [digest, address] },
			];

			for (const attempt of ethSignAttempts) {
				try {
					const sig = await client.request({ method: attempt.method, params: attempt.params });
					if (typeof sig === "string" && sig.startsWith("0x")) return sig as `0x${string}`;
					throw new Error("Unexpected signature response.");
				} catch (err) {
					lastError = err;
				}
			}
		} catch (err) {
			lastError = err;
		}

		throw lastError instanceof Error ? lastError : new Error("Failed to sign typed data.");
	};

	return { getAddresses, getChainId, signTypedData };
}

