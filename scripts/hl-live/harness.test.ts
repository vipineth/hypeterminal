import { ExchangeClient, HttpTransport } from "@nktkas/hyperliquid";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentNotApproved, agentWallet, loadKeys, openHarness, principalWallet, SigningRefused } from "./harness";

const keys = { principalKey: generatePrivateKey(), agentKey: generatePrivateKey() };
const principal = privateKeyToAccount(keys.principalKey);
const agent = privateKeyToAccount(keys.agentKey);
const order = { a: 0, b: true, p: "100000", s: "0.001", r: false, t: { limit: { tif: "Gtc" as const } } };

let requests: string[];
let agentRole: unknown;

async function failure(promise: Promise<unknown>): Promise<string> {
	try {
		await promise;
	} catch (error) {
		const messages: string[] = [];
		for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) messages.push(cause.message);
		return messages.join(" <- ");
	}
	throw new Error("expected a rejection");
}

beforeEach(() => {
	requests = [];
	agentRole = { role: "agent", data: { user: principal.address.toLowerCase() } };
	vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
		const url = input instanceof Request ? input.url : String(input);
		requests.push(url);
		if (url.endsWith("/info") && JSON.parse(String(init?.body)).type === "userRole") return Response.json(agentRole);
		return Response.json({ status: "ok", response: { type: "default" } });
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("mainnet transport", () => {
	const mainnet = new HttpTransport();

	it("cannot build a harness and sends nothing", async () => {
		await expect(openHarness(mainnet, keys)).rejects.toThrow(SigningRefused);
		expect(requests).toEqual([]);
	});

	it("refuses to sign an agent order and sends nothing", async () => {
		const exchange = new ExchangeClient({ transport: mainnet, wallet: agentWallet(agent, mainnet) });
		expect(await failure(exchange.order({ orders: [order], grouping: "na" }))).toMatch(/not testnet/);
		expect(requests).toEqual([]);
	});

	it("refuses to sign a principal transfer and sends nothing", async () => {
		const exchange = new ExchangeClient({ transport: mainnet, wallet: principalWallet(principal, mainnet) });
		expect(await failure(exchange.usdClassTransfer({ amount: "1", toPerp: false }))).toMatch(/not testnet/);
		expect(requests).toEqual([]);
	});
});

describe("testnet transport", () => {
	const testnet = new HttpTransport({ isTestnet: true });

	it("signs a principal transfer and posts it to the testnet exchange", async () => {
		const exchange = new ExchangeClient({ transport: testnet, wallet: principalWallet(principal, testnet) });
		await exchange.usdClassTransfer({ amount: "1", toPerp: false });
		expect(requests).toEqual(["https://api.hyperliquid-testnet.xyz/exchange"]);
	});

	it("never lets the principal approve an agent or a builder fee", async () => {
		const exchange = new ExchangeClient({ transport: testnet, wallet: principalWallet(principal, testnet) });
		expect(await failure(exchange.approveAgent({ agentAddress: agent.address, agentName: "x" }))).toMatch(/refusing principal action HyperliquidTransaction:ApproveAgent/,);
		expect(await failure(exchange.approveBuilderFee({ builder: agent.address, maxFeeRate: "0.1%" }),)).toMatch(/refusing principal action/);
		expect(requests).toEqual([]);
	});

	it("refuses user-signed typed data that names mainnet", async () => {
		const wallet = principalWallet(principal, testnet) as { signTypedData(params: unknown): Promise<string> };
		const typedData = {
			domain: { name: "HyperliquidSignTransaction", version: "1", chainId: 421614, verifyingContract: "0x0000000000000000000000000000000000000000" },
			types: {
				EIP712Domain: [
					{ name: "name", type: "string" },
					{ name: "version", type: "string" },
					{ name: "chainId", type: "uint256" },
					{ name: "verifyingContract", type: "address" },
				],
				"HyperliquidTransaction:UsdClassTransfer": [
					{ name: "hyperliquidChain", type: "string" },
					{ name: "amount", type: "string" },
					{ name: "toPerp", type: "bool" },
					{ name: "nonce", type: "uint64" },
				],
			},
			primaryType: "HyperliquidTransaction:UsdClassTransfer",
			message: { hyperliquidChain: "Mainnet", amount: "1", toPerp: false, nonce: 1 },
		} as const;
		expect(await failure(wallet.signTypedData(typedData as never))).toMatch(/refusing hyperliquidChain "Mainnet"/);
	});

	it("refuses an L1 action signed with the mainnet source", async () => {
		const wallet = agentWallet(agent, testnet);
		const params = {
			domain: { name: "Exchange", version: "1", chainId: 1337, verifyingContract: "0x0000000000000000000000000000000000000000" },
			types: { Agent: [{ name: "source", type: "string" }, { name: "connectionId", type: "bytes32" }] },
			primaryType: "Agent",
			message: { source: "a", connectionId: `0x${"00".repeat(32)}` },
		} as const;
		expect(await failure(wallet.signTypedData(params as never))).toMatch(/agent refuses Agent with source a/);
	});
});

describe("agent binding", () => {
	const testnet = new HttpTransport({ isTestnet: true });
	const other = "0x00000000000000000000000000000000000000bb";

	it("opens a harness whose agent signs for the principal", async () => {
		const h = await openHarness(testnet, keys);
		await h.agent.order({ orders: [order], grouping: "na" });
		expect(requests).toEqual(["https://api.hyperliquid-testnet.xyz/info", "https://api.hyperliquid-testnet.xyz/exchange"]);
	});

	it.each([
		["another account", { role: "agent", data: { user: other } }, other],
		["no account", { role: "user" }, "no account"],
	])("never yields a harness when the agent signs for %s", async (_label, role, named) => {
		agentRole = role;
		await expect(openHarness(testnet, keys)).rejects.toThrow(AgentNotApproved);
		await expect(openHarness(testnet, keys)).rejects.toThrow(named);
		expect(requests.every((url) => url.endsWith("/info"))).toBe(true);
	});
});

describe("key selection", () => {
	const env = (extra: Record<string, string>) => ({ HL_ENV_FILE: "/dev/null", ...extra });

	it("reads the dedicated harness keys by default, never principal 1's variable", () => {
		const live = generatePrivateKey();
		const keys = loadKeys(env({ HL_LIVE_PRINCIPAL_KEY: live, HL_LIVE_AGENT_KEY: generatePrivateKey(), HL_TESTNET_PRINCIPAL_KEY: generatePrivateKey() }));
		expect(keys.principalKey).toBe(live);
		expect(() => loadKeys(env({ HL_TESTNET_PRINCIPAL_KEY: generatePrivateKey(), HL_TESTNET_AGENT_KEY: generatePrivateKey() }))).toThrow("HL_LIVE_PRINCIPAL_KEY is not set");
	});

	it("pairs a numbered principal with its own agent", () => {
		const agentKey = generatePrivateKey();
		const keys = loadKeys(env({ HL_PRINCIPAL: "2", HL_TESTNET_PRINCIPAL2_KEY: generatePrivateKey(), HL_TESTNET_AGENT2_KEY: agentKey, HL_TESTNET_AGENT_KEY: generatePrivateKey() }));
		expect(keys.agentKey).toBe(agentKey);
	});
});
