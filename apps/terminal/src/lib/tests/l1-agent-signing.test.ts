/**
 * Correctness tests for createL1AgentWallet.
 *
 * The only thing that matters: the fast path must produce byte-for-byte identical
 * signatures to viem's standard signTypedData. If they diverge, orders signed by
 * the fast path will be rejected by the Hyperliquid exchange.
 *
 * Test vectors use the Ethereum genesis block hash as a known external anchor:
 *   0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3
 * Anyone can verify this is block 0's hash at etherscan.io/block/0 — it's not
 * a made-up constant and gives the tests a real-world reference point.
 */

import { createL1AgentWallet } from "@hypeterminal/hl-react/signing/l1-agent-wallet";
import { recoverTypedDataAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";

// Anvil account #0 — a publicly documented test key, safe to hardcode
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Ethereum genesis block hash — a well-known, externally verifiable 32-byte constant
const GENESIS_BLOCK_HASH = "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3" as const;

// The exact domain + types the SDK passes to your wallet on every order
const L1_DOMAIN = {
	name: "Exchange",
	version: "1",
	chainId: 1337n,
	verifyingContract: ZERO_ADDRESS,
} as const;

const L1_TYPES = {
	EIP712Domain: [
		{ name: "name", type: "string" },
		{ name: "version", type: "string" },
		{ name: "chainId", type: "uint256" },
		{ name: "verifyingContract", type: "address" },
	],
	Agent: [
		{ name: "source", type: "string" },
		{ name: "connectionId", type: "bytes32" },
	],
} as const;

const account = privateKeyToAccount(PRIVATE_KEY);
const l1Wallet = createL1AgentWallet(account);

describe("createL1AgentWallet", () => {
	describe("signature correctness", () => {
		it("produces identical signature to viem for mainnet (source: a)", async () => {
			const message = { source: "a", connectionId: GENESIS_BLOCK_HASH };

			const expected = await account.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			const actual = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			expect(actual).toBe(expected);
		});

		it("produces identical signature to viem for testnet (source: b)", async () => {
			const message = { source: "b", connectionId: GENESIS_BLOCK_HASH };

			const expected = await account.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			const actual = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			expect(actual).toBe(expected);
		});

		it("produces identical signature for a different connectionId", async () => {
			// A different 32-byte connection ID (SHA-256 of "hyperliquid" in hex)
			const connectionId = "0x0f50c8ea0d143b3d9d2e038f2d2e6d2e9f3a1b5c7e8f9a0b1c2d3e4f50617283" as const;
			const message = { source: "a", connectionId };

			const expected = await account.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			const actual = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			expect(actual).toBe(expected);
		});
	});

	describe("signature validity", () => {
		it("recovered signer address matches the account address", async () => {
			const message = { source: "a", connectionId: GENESIS_BLOCK_HASH };

			const signature = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
			});

			const recovered = await recoverTypedDataAddress({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message,
				signature,
			});

			expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
		});
	});

	describe("different connectionIds produce different signatures", () => {
		it("two different connectionIds never produce the same signature", async () => {
			const sig1 = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message: { source: "a", connectionId: GENESIS_BLOCK_HASH },
			});

			const sig2 = await l1Wallet.signTypedData({
				domain: L1_DOMAIN,
				types: L1_TYPES,
				primaryType: "Agent",
				message: {
					source: "a",
					connectionId: "0x1111111111111111111111111111111111111111111111111111111111111111",
				},
			});

			expect(sig1).not.toBe(sig2);
		});
	});

	describe("passthrough for non-L1 domains", () => {
		it("falls through to standard signTypedData for a different domain", async () => {
			// Simulates approveAgent or similar user-signed action (different domain name)
			const domain = {
				name: "HyperliquidSignTransaction",
				version: "1",
				chainId: 421614n,
				verifyingContract: ZERO_ADDRESS,
			};
			const types = {
				EIP712Domain: [
					{ name: "name", type: "string" },
					{ name: "version", type: "string" },
					{ name: "chainId", type: "uint256" },
					{ name: "verifyingContract", type: "address" },
				],
				HyperliquidTransaction: [
					{ name: "hyperliquidChain", type: "string" },
					{ name: "agentAddress", type: "address" },
					{ name: "nonce", type: "uint64" },
				],
			} as const;
			const message = {
				hyperliquidChain: "Arbitrum",
				agentAddress: "0x000000000000000000000000000000000000dead" as const,
				nonce: 1234n,
			};

			const expected = await account.signTypedData({ domain, types, primaryType: "HyperliquidTransaction", message });
			const actual = await l1Wallet.signTypedData({ domain, types, primaryType: "HyperliquidTransaction", message });

			expect(actual).toBe(expected);
		});

		it("falls through for the L1 domain with a different primaryType", async () => {
			const types = {
				EIP712Domain: [
					{ name: "name", type: "string" },
					{ name: "version", type: "string" },
					{ name: "chainId", type: "uint256" },
					{ name: "verifyingContract", type: "address" },
				],
				NotAnAgent: [{ name: "value", type: "string" }],
			} as const;
			const message = { value: "test" };

			const expected = await account.signTypedData({ domain: L1_DOMAIN, types, primaryType: "NotAnAgent", message });
			const actual = await l1Wallet.signTypedData({ domain: L1_DOMAIN, types, primaryType: "NotAnAgent", message });

			expect(actual).toBe(expected);
		});
	});
});
