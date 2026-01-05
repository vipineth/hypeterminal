import type { AbstractWallet } from "@nktkas/hyperliquid/signing";
import type { Account, WalletClient } from "viem";

type WalletClientLike = Pick<WalletClient, "signTypedData"> & {
	account?: Account | null;
};

function isWalletClientLike(value: unknown): value is WalletClientLike {
	if (!value || typeof value !== "object") return false;
	return "signTypedData" in value && typeof (value as WalletClientLike).signTypedData === "function";
}

export function toHyperliquidWallet(
	walletClient: unknown,
	accountOverride?: `0x${string}` | null,
): AbstractWallet | null {
	if (!isWalletClientLike(walletClient)) return null;

	const client = walletClient;
	const accountAddress = accountOverride ?? client.account?.address;

	if (!accountAddress) return null;

	return {
		address: accountAddress,
		signTypedData: async (params) => {
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
