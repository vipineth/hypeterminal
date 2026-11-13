import type { AbstractViemJsonRpcAccount, AbstractWallet } from "@nktkas/hyperliquid/signing";
import { type Account, serializeTypedData, type WalletClient } from "viem";

type SignTypedDataParams = Parameters<AbstractViemJsonRpcAccount["signTypedData"]>[0];

type WalletClientLike = Pick<WalletClient, "request"> & {
	account?: Account | null;
	getAddresses?: () => Promise<`0x${string}`[]>;
	getChainId?: () => Promise<number>;
};

type FullWalletClient = WalletClientLike & {
	getAddresses: () => Promise<`0x${string}`[]>;
	getChainId: () => Promise<number>;
};

function isWalletClientLike(value: unknown): value is WalletClientLike {
	if (!value || typeof value !== "object") return false;
	return "request" in value && typeof value.request === "function";
}

function isFullWalletClient(value: unknown): value is FullWalletClient {
	return (
		isWalletClientLike(value) && typeof value.getAddresses === "function" && typeof value.getChainId === "function"
	);
}

// Some viem releases reject struct names containing ":" before signing, and every Hyperliquid
// user-signed type is "HyperliquidTransaction:*", so the request goes to the wallet directly.
function signWithWallet(client: WalletClientLike, account: `0x${string}`, params: SignTypedDataParams) {
	return client.request(
		{
			method: "eth_signTypedData_v4",
			params: [account, serializeTypedData(params as Parameters<typeof serializeTypedData>[0])],
		},
		{ retryCount: 0 },
	);
}

/** Needs a client with an EIP-1193 `request`, such as a viem wallet client. A bare account returns null. */
export function toHyperliquidWallet(
	walletClient: unknown,
	accountOverride?: `0x${string}` | null,
): AbstractWallet | null {
	if (isFullWalletClient(walletClient)) {
		const client = walletClient;
		const account = accountOverride ?? client.account?.address;
		if (!account) return null;
		return {
			signTypedData: (params: SignTypedDataParams) => signWithWallet(client, account, params),
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
		signTypedData: (params: SignTypedDataParams) => signWithWallet(client, accountAddress, params),
	};
}
