import type { AbstractViemJsonRpcAccount, AbstractWallet } from "@nktkas/hyperliquid/signing";
import type { Account, WalletClient } from "viem";

type SignTypedDataParams = Parameters<AbstractViemJsonRpcAccount["signTypedData"]>[0];

type FullWalletClient = WalletClient & {
	getAddresses: () => Promise<`0x${string}`[]>;
	getChainId: () => Promise<number>;
};

type WalletClientLike = Pick<WalletClient, "signTypedData"> & {
	account?: Account | null;
	getAddresses?: () => Promise<`0x${string}`[]>;
	getChainId?: () => Promise<number>;
};

function isFullWalletClient(value: unknown): value is FullWalletClient {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	return (
		typeof obj.signTypedData === "function" &&
		typeof obj.getAddresses === "function" &&
		typeof obj.getChainId === "function"
	);
}

function isWalletClientLike(value: unknown): value is WalletClientLike {
	if (!value || typeof value !== "object") return false;
	return "signTypedData" in value && typeof (value as WalletClientLike).signTypedData === "function";
}

export function toHyperliquidWallet(
	walletClient: unknown,
	accountOverride?: `0x${string}` | null,
): AbstractWallet | null {
	if (isFullWalletClient(walletClient)) {
		const client = walletClient;
		const account = accountOverride ?? client.account?.address;
		if (!account) return null;
		return {
			signTypedData: async (params: SignTypedDataParams) => {
				return client.signTypedData({
					account,
					domain: params.domain as Parameters<WalletClient["signTypedData"]>[0]["domain"],
					types: params.types as Parameters<WalletClient["signTypedData"]>[0]["types"],
					primaryType: params.primaryType,
					message: params.message,
				});
			},
			getAddresses: () => client.getAddresses(),
			getChainId: () => client.getChainId(),
		} satisfies AbstractViemJsonRpcAccount;
	}

	if (!isWalletClientLike(walletClient)) return null;

	const client = walletClient;
	const accountAddress = accountOverride ?? client.account?.address;

	if (!accountAddress) return null;

	return {
		address: accountAddress,
		signTypedData: async (params: SignTypedDataParams) => {
			return client.signTypedData({
				account: client.account ?? accountAddress,
				domain: params.domain as Parameters<WalletClient["signTypedData"]>[0]["domain"],
				types: params.types as Parameters<WalletClient["signTypedData"]>[0]["types"],
				primaryType: params.primaryType,
				message: params.message,
			});
		},
	};
}
