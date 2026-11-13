import * as exchange from "@nktkas/hyperliquid/api/exchange";
import { type AbstractWallet, signUserSignedAction } from "@nktkas/hyperliquid/signing";
import {
	type Address,
	concat,
	createWalletClient,
	custom,
	encodeAbiParameters,
	type Hex,
	keccak256,
	pad,
	recoverAddress,
	toHex,
	zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { toHyperliquidWallet } from "./wallet";

interface TypedField {
	name: string;
	type: string;
}

type TypeMap = Record<string, TypedField[]>;

interface TypedDataJson {
	domain: Record<string, unknown>;
	types: TypeMap;
	primaryType: string;
	message: Record<string, unknown>;
}

interface RpcCall {
	method: string;
	params?: unknown;
}

const SIGNATURE_CHAIN_ID = "0x66eee";
const SIGNER = "0x9fed7c631d8d525ce642402c0e36a73cf5c77c1c";
const FAKE_SIGNATURE = `0x${"11".repeat(32)}${"22".repeat(32)}1b` as const;

const SAMPLE_VALUES: Record<string, unknown> = {
	string: "1",
	address: "0x16f05e773ce03b84fbb6c55b0642b0b7c6a1acbb",
	bool: true,
	bytes: "0xdeadbeef",
	uint32: 42161,
	uint64: 1_763_000_000_000,
};

const DOMAIN = {
	name: "HyperliquidSignTransaction",
	version: "1",
	chainId: Number(SIGNATURE_CHAIN_ID),
	verifyingContract: zeroAddress,
};

const EIP712_DOMAIN_FIELDS: TypedField[] = [
	{ name: "name", type: "string" },
	{ name: "version", type: "string" },
	{ name: "chainId", type: "uint256" },
	{ name: "verifyingContract", type: "address" },
];

const USER_SIGNED_TYPES = Object.entries(exchange)
	.filter(([name]) => name.endsWith("Types"))
	.map(([, types]) => {
		const typeMap = types as TypeMap;
		const [primaryType] = Object.keys(typeMap);
		return { primaryType, typeMap };
	});

function sampleAction(fields: TypedField[]) {
	const action: Record<string, unknown> = { signatureChainId: SIGNATURE_CHAIN_ID };
	for (const { name, type } of fields) {
		if (!(type in SAMPLE_VALUES)) throw new Error(`no sample value for EIP-712 type ${type}`);
		action[name] = SAMPLE_VALUES[type];
	}
	return action as Parameters<typeof signUserSignedAction>[0]["action"];
}

function createProvider(sign: (typedData: TypedDataJson) => Hex | Promise<Hex>) {
	const calls: RpcCall[] = [];
	async function request({ method, params }: RpcCall) {
		calls.push({ method, params });
		if (method === "eth_signTypedData_v4") {
			const [, typedData] = params as [Address, string];
			return sign(JSON.parse(typedData));
		}
		if (method === "eth_accounts" || method === "eth_requestAccounts") return [SIGNER];
		if (method === "eth_chainId") return SIGNATURE_CHAIN_ID;
		throw new Error(`unexpected rpc ${method}`);
	}
	return { calls, request };
}

function createClients(sign: (typedData: TypedDataJson) => Hex) {
	const provider = createProvider(sign);
	const walletClient = createWalletClient({ account: SIGNER, transport: custom(provider) });
	return {
		provider,
		walletClient,
		walletClientWithoutChain: { ...walletClient, getAddresses: undefined, getChainId: undefined },
	};
}

function adapt(client: unknown, address: Address = SIGNER): AbstractWallet {
	const wallet = toHyperliquidWallet(client, address);
	if (!wallet) throw new Error("toHyperliquidWallet returned null");
	return wallet;
}

function hashStruct(types: TypeMap, typeName: string, data: Record<string, unknown>): Hex {
	const fields = types[typeName];
	const typeString = `${typeName}(${fields.map((f) => `${f.type} ${f.name}`).join(",")})`;
	const encoded = fields.map(({ name, type }) => {
		const value = data[name];
		if (type === "string") return keccak256(toHex(value as string));
		if (type === "bytes") return keccak256(value as Hex);
		return encodeAbiParameters([{ type }], [value]);
	});
	return keccak256(concat([keccak256(toHex(typeString)), ...encoded]));
}

function hashTypedDataJson({ domain, types, primaryType, message }: TypedDataJson): Hex {
	return keccak256(
		concat(["0x1901", hashStruct(types, "EIP712Domain", domain), hashStruct(types, primaryType, message)]),
	);
}

describe("toHyperliquidWallet", () => {
	it("covers all 17 user-signed actions in SDK 0.33.3", () => {
		expect(USER_SIGNED_TYPES).toHaveLength(17);
		for (const { primaryType } of USER_SIGNED_TYPES) expect(primaryType).toMatch(/^HyperliquidTransaction:/);
	});

	describe.each([
		["a viem wallet client", "walletClient"],
		["a wallet client without getAddresses and getChainId", "walletClientWithoutChain"],
	] as const)("given %s", (_label, clientKey) => {
		it.each(USER_SIGNED_TYPES)(
			"sends $primaryType to the wallet as eth_signTypedData_v4",
			async ({ primaryType, typeMap }) => {
				const clients = createClients(() => FAKE_SIGNATURE);
				const action = sampleAction(typeMap[primaryType]);

				const signature = await signUserSignedAction({ wallet: adapt(clients[clientKey]), action, types: typeMap });

				const signCalls = clients.provider.calls.filter((call) => call.method === "eth_signTypedData_v4");
				expect(signCalls).toHaveLength(1);
				const [account, json] = signCalls[0].params as [Address, string];
				const typedData: TypedDataJson = JSON.parse(json);
				expect(account.toLowerCase()).toBe(SIGNER);
				expect(typedData.primaryType).toBe(primaryType);
				expect(typedData.types[primaryType]).toEqual(typeMap[primaryType]);
				expect(typedData.types.EIP712Domain).toBeDefined();
				expect(typedData.domain).toEqual(DOMAIN);
				expect(Object.keys(typedData.message).sort()).toEqual(typeMap[primaryType].map((f) => f.name).sort());
				expect(signature).toEqual({ r: `0x${"11".repeat(32)}`, s: `0x${"22".repeat(32)}`, v: 27 });
			},
		);

		it("prompts the wallet once when signing fails with a retryable error", async () => {
			const clients = createClients(() => {
				throw Object.assign(new Error("Internal JSON-RPC error"), { code: -32603 });
			});

			await expect(
				signUserSignedAction({
					wallet: adapt(clients[clientKey]),
					action: sampleAction(exchange.UsdSendTypes["HyperliquidTransaction:UsdSend"]),
					types: exchange.UsdSendTypes,
				}),
			).rejects.toThrow();

			expect(clients.provider.calls.filter((call) => call.method === "eth_signTypedData_v4")).toHaveLength(1);
		});
	});

	it.each(USER_SIGNED_TYPES)(
		"returns a $primaryType signature that recovers to the signing key",
		async ({ primaryType, typeMap }) => {
			const account = privateKeyToAccount(generatePrivateKey());
			const provider = createProvider((typedData) =>
				account.signTypedData(typedData as Parameters<typeof account.signTypedData>[0]),
			);
			const walletClient = createWalletClient({ account: account.address, transport: custom(provider) });
			const action = sampleAction(typeMap[primaryType]);

			const { r, s, v } = await signUserSignedAction({
				wallet: adapt(walletClient, account.address),
				action,
				types: typeMap,
			});

			const digest = keccak256(
				concat([
					"0x1901",
					hashStruct({ EIP712Domain: EIP712_DOMAIN_FIELDS }, "EIP712Domain", DOMAIN),
					hashStruct(typeMap, primaryType, action),
				]),
			);
			const recovered = await recoverAddress({ hash: digest, signature: concat([r, s, toHex(v)]) });
			expect(recovered).toBe(account.address);
		},
	);

	it("returns a UsdSend signature that recovers against hand-encoded EIP-712", async () => {
		const account = privateKeyToAccount(generatePrivateKey());
		const provider = createProvider((typedData) => account.sign({ hash: hashTypedDataJson(typedData) }));
		const walletClient = createWalletClient({ account: account.address, transport: custom(provider) });
		const action = {
			type: "usdSend",
			signatureChainId: SIGNATURE_CHAIN_ID,
			hyperliquidChain: "Testnet",
			destination: SIGNER,
			amount: "1",
			time: 1_763_000_000_000,
		} as const;

		const { r, s, v } = await signUserSignedAction({
			wallet: adapt(walletClient, account.address),
			action,
			types: exchange.UsdSendTypes,
		});

		const domainSeparator = keccak256(
			concat([
				keccak256(toHex("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
				keccak256(toHex("HyperliquidSignTransaction")),
				keccak256(toHex("1")),
				pad(toHex(421614)),
				pad(zeroAddress),
			]),
		);
		const structHash = keccak256(
			concat([
				keccak256(
					toHex("HyperliquidTransaction:UsdSend(string hyperliquidChain,string destination,string amount,uint64 time)"),
				),
				keccak256(toHex("Testnet")),
				keccak256(toHex(SIGNER)),
				keccak256(toHex("1")),
				pad(toHex(action.time)),
			]),
		);
		const digest = keccak256(concat(["0x1901", domainSeparator, structHash]));

		const recovered = await recoverAddress({ hash: digest, signature: concat([r, s, toHex(v)]) });
		expect(recovered).toBe(account.address);
	});
});
