import { type Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { decodeFunctionData, encodeFunctionResult, erc20Abi, type Hex, multicall3Abi } from "viem";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WagmiProvider } from "wagmi";
import { polygon } from "wagmi/chains";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";
import { getRpcUrl } from "@/config/rpc";
import { createWagmiConfig } from "@/config/wagmi";
import { type UseDepositResult, useDeposit } from "./use-deposit";

const HASH = "0x1111111111111111111111111111111111111111111111111111111111111111";
const ADDRESS = "0x5b5d51203a0f9079f8aeb098a6523a13f298c060";
const BLOCK = "0x10";
const TWENTY_USDC = encodeFunctionResult({ abi: erc20Abi, functionName: "balanceOf", result: 20_000_000n });

vi.mock("wagmi", async (importOriginal) => ({
	...(await importOriginal<typeof import("wagmi")>()),
	useConnection: () => ({ address: ADDRESS }),
	useWriteContract: () => ({ mutate: vi.fn(), data: HASH, isPending: false, error: null, reset: vi.fn() }),
}));

const receipt = {
	blockHash: `0x${"22".repeat(32)}`,
	blockNumber: BLOCK,
	contractAddress: null,
	cumulativeGasUsed: "0x1",
	effectiveGasPrice: "0x1",
	from: `0x${"33".repeat(20)}`,
	gasUsed: "0x1",
	logs: [],
	logsBloom: `0x${"00".repeat(256)}`,
	status: "0x1",
	to: `0x${"44".repeat(20)}`,
	transactionHash: HASH,
	transactionIndex: "0x0",
	type: "0x2",
};

type Rpc = (method: string, params: [{ data: Hex }]) => Promise<unknown>;

function answerCall(params: [{ data: Hex }], result: Hex) {
	const { functionName, args } = decodeFunctionData({ abi: multicall3Abi, data: params[0].data });
	if (functionName !== "aggregate3") return result;
	return encodeFunctionResult({
		abi: multicall3Abi,
		functionName,
		result: args[0].map(() => ({ success: true, returnData: result })),
	});
}

function stubRpc(answer: Rpc) {
	const origins: string[] = [];
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
			const url = input instanceof Request ? input.url : String(input);
			origins.push(new URL(url).origin);
			const { id, method, params } = JSON.parse(String(init?.body));
			const result = await answer(method, params);
			return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
				headers: { "content-type": "application/json" },
			});
		}),
	);
	return origins;
}

function Probe({ onResult }: { onResult: (result: UseDepositResult) => void }) {
	onResult(useDeposit());
	return null;
}

type ChainId = ReturnType<typeof createWagmiConfig>["chains"][number]["id"];

function renderDeposit(chainId: ChainId, queryClient: QueryClient) {
	const config = createWagmiConfig();
	config.setState((state) => ({ ...state, chainId }));
	let result: UseDepositResult | undefined;
	renderToString(
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<Probe
					onResult={(deposit) => {
						result = deposit;
					}}
				/>
			</QueryClientProvider>
		</WagmiProvider>,
	);
	if (!result) throw new Error("useDeposit did not render");
	return result;
}

function findQuery(queryClient: QueryClient, key: string): Query {
	const query = queryClient
		.getQueryCache()
		.findAll()
		.find((candidate) => candidate.queryKey[0] === key);
	if (!query) throw new Error(`no ${key} query`);
	return query;
}

function createQueryClient() {
	return new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnMount: false } } });
}

async function cacheTwentyUsdc(queryClient: QueryClient) {
	renderDeposit(ARBITRUM_CHAIN_ID, queryClient);
	const balanceQuery = findQuery(queryClient, "readContract");
	stubRpc(async (_method, params) => answerCall(params, TWENTY_USDC));
	await balanceQuery.fetch();
	expect(renderDeposit(ARBITRUM_CHAIN_ID, queryClient).balance).toMatchObject({ status: "ready", formatted: "20" });
	return balanceQuery;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useDeposit balance", () => {
	it("blocks a deposit when the refresh of a cached balance fails", async () => {
		const queryClient = createQueryClient();
		const balanceQuery = await cacheTwentyUsdc(queryClient);

		stubRpc(async () => {
			throw new Error("rpc down");
		});
		await balanceQuery.fetch().catch(() => {});

		const deposit = renderDeposit(ARBITRUM_CHAIN_ID, queryClient);
		expect(deposit.balance).toEqual({ status: "error" });
		expect(deposit.validate("10").valid).toBe(false);
	});

	it("blocks a deposit while a cached balance is still refreshing", async () => {
		const queryClient = createQueryClient();
		const balanceQuery = await cacheTwentyUsdc(queryClient);

		stubRpc(() => new Promise(() => {}));
		void balanceQuery.fetch();

		const deposit = renderDeposit(ARBITRUM_CHAIN_ID, queryClient);
		expect(deposit.balance.status).toBe("refreshing");
		expect(deposit.validate("10").valid).toBe(false);
	});
});

describe("useDeposit receipt", () => {
	it("confirms the deposit on Arbitrum after the wallet switches chains", async () => {
		const queryClient = createQueryClient();
		renderDeposit(polygon.id, queryClient);
		const receiptQuery = findQuery(queryClient, "waitForTransactionReceipt");

		const origins = stubRpc(async (method) => (method === "eth_getTransactionReceipt" ? receipt : BLOCK));
		await receiptQuery.fetch();

		expect(origins.length).toBeGreaterThan(0);
		expect(new Set(origins)).toEqual(new Set([new URL(String(getRpcUrl(ARBITRUM_CHAIN_ID, import.meta.env))).origin]));
	});
});
