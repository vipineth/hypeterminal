import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ExchangeClient, type HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { createWalletClient, custom, type Hex, type TypedDataDomain } from "viem";
import { generatePrivateKey, type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { createL1AgentWallet } from "../../packages/hl-react/src/signing/l1-agent-wallet.ts";
import { toHyperliquidWallet } from "../../packages/hl-react/src/wallet.ts";
import { z } from "zod";

const SIGNATURE_CHAIN_ID = "0x66eee";
const KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const PRINCIPAL_SELECTOR = /^\d*$/;

export const PRINCIPAL_PRIMARY_TYPES = new Set([
	"HyperliquidTransaction:UsdClassTransfer",
	"HyperliquidTransaction:SendAsset",
	"HyperliquidTransaction:UserSetAbstraction",
]);

export interface HarnessKeys {
	principalKey: Hex;
	agentKey: Hex;
}

export interface Harness {
	transport: HttpTransport;
	info: InfoClient;
	principal: ExchangeClient;
	agent: ExchangeClient;
	user: Hex;
	agentAddress: Hex;
}

interface TypedDataJson {
	domain: TypedDataDomain;
	types: Record<string, { name: string; type: string }[]>;
	primaryType: string;
	message: Record<string, unknown>;
}

type AgentSignParams = Parameters<ReturnType<typeof createL1AgentWallet>["signTypedData"]>[0];

export class SigningRefused extends Error {}

export function assertTestnet(transport: HttpTransport): void {
	if (transport.isTestnet !== true) throw new SigningRefused("refusing to sign: transport is not testnet");
}

function mainCheckoutEnvFile(): string {
	const gitDir = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
		cwd: dirname(new URL(import.meta.url).pathname),
		encoding: "utf8",
	}).trim();
	return join(dirname(gitDir), "apps/terminal/.env.local");
}

function readEnvFile(path: string): Map<string, string> {
	const entries = new Map<string, string>();
	if (!existsSync(path)) return entries;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\s]*)"?\s*$/.exec(line);
		if (match) entries.set(match[1], match[2]);
	}
	return entries;
}

function isKey(value: string): value is Hex {
	return KEY_PATTERN.test(value);
}

function parseKey(name: string, raw: string | undefined): Hex {
	if (!raw) throw new Error(`${name} is not set`);
	const key = raw.startsWith("0x") ? raw : `0x${raw}`;
	if (!isKey(key)) throw new Error(`${name} is not a 32-byte hex key`);
	return key;
}

function keyNames(selector: string): { principal: string; agent: string } {
	if (selector === "") return { principal: "HL_LIVE_PRINCIPAL_KEY", agent: "HL_LIVE_AGENT_KEY" };
	const suffix = selector === "1" ? "" : selector;
	return { principal: `HL_TESTNET_PRINCIPAL${suffix}_KEY`, agent: `HL_TESTNET_AGENT${suffix}_KEY` };
}

export function loadKeys(env: NodeJS.ProcessEnv = process.env): HarnessKeys {
	const selector = env.HL_PRINCIPAL ?? "";
	if (selector === "fresh") return { principalKey: generatePrivateKey(), agentKey: generatePrivateKey() };
	if (!PRINCIPAL_SELECTOR.test(selector)) throw new Error("HL_PRINCIPAL must be digits or fresh");
	const file = readEnvFile(env.HL_ENV_FILE ?? mainCheckoutEnvFile());
	const read = (name: string) => env[name] ?? file.get(name);
	const names = keyNames(selector);
	return { principalKey: parseKey(names.principal, read(names.principal)), agentKey: parseKey(names.agent, read(names.agent)) };
}

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

const mainnetReads = {
	spotClearinghouseState: z.object({
		balances: z.array(z.object({ coin: z.string(), total: decimal })),
		evmEscrows: z.array(z.object({ coin: z.string(), total: decimal })).optional(),
	}),
	perpDexs: z.tuple([z.null()], z.object({ name: z.string().min(1) })),
	clearinghouseState: z.object({ marginSummary: z.object({ accountValue: decimal }), assetPositions: z.array(z.unknown()) }),
	delegatorSummary: z.object({ delegated: decimal, undelegated: decimal, totalPendingWithdrawal: decimal, nPendingWithdrawals: z.number().int() }),
	userVaultEquities: z.array(z.object({ vaultAddress: z.string(), equity: decimal })),
	subAccounts: z.array(z.object({ name: z.string(), subAccountUser: z.string() })).nullable(),
	borrowLendUserState: z.object({
		tokenToState: z.array(z.tuple([z.number(), z.object({ borrow: z.object({ value: decimal }), supply: z.object({ value: decimal }) })])),
	}),
	referral: z.object({ unclaimedRewards: decimal, builderRewards: decimal }),
	leadingVaults: z.array(z.object({ address: z.string(), name: z.string() })),
};

type MainnetRead = keyof typeof mainnetReads;

async function strictRead<K extends MainnetRead>(read: K, response: Promise<unknown>): Promise<z.infer<(typeof mainnetReads)[K]>> {
	const parsed = mainnetReads[read].safeParse(await response);
	if (!parsed.success) throw new Error(`mainnet ${read} is not the expected shape: ${z.prettifyError(parsed.error)}`);
	return parsed.data as z.infer<(typeof mainnetReads)[K]>;
}

function isZero(value: string): boolean {
	return /^-?0+(\.0+)?$/.test(value);
}

export async function mainnetHoldings(mainnet: InfoClient, user: Hex): Promise<string[]> {
	const [spot, dexs, stake, vaults, subAccounts, lending, referral, leading] = await Promise.all([
		strictRead("spotClearinghouseState", mainnet.spotClearinghouseState({ user })),
		strictRead("perpDexs", mainnet.perpDexs()),
		strictRead("delegatorSummary", mainnet.delegatorSummary({ user })),
		strictRead("userVaultEquities", mainnet.userVaultEquities({ user })),
		strictRead("subAccounts", mainnet.subAccounts({ user })),
		strictRead("borrowLendUserState", mainnet.borrowLendUserState({ user })),
		strictRead("referral", mainnet.referral({ user })),
		strictRead("leadingVaults", mainnet.leadingVaults({ user })),
	]);
	const holdings = [
		...spot.balances.filter((balance) => !isZero(balance.total)).map((balance) => `${balance.total} ${balance.coin} in spot`),
		...(spot.evmEscrows ?? []).filter((escrow) => !isZero(escrow.total)).map((escrow) => `${escrow.total} ${escrow.coin} in EVM escrow`),
		...(isZero(stake.delegated) ? [] : [`${stake.delegated} HYPE staked`]),
		...(isZero(stake.undelegated) ? [] : [`${stake.undelegated} HYPE undelegated in staking`]),
		...(isZero(stake.totalPendingWithdrawal) && stake.nPendingWithdrawals === 0 ? [] : [`${stake.totalPendingWithdrawal} HYPE pending withdrawal from staking`]),
		...vaults.filter((vault) => !isZero(vault.equity)).map((vault) => `${vault.equity} USDC in vault ${vault.vaultAddress}`),
		...(subAccounts ?? []).map((account) => `sub-account ${account.name} ${account.subAccountUser}`),
		...lending.tokenToState.flatMap(([token, state]) => [
			...(isZero(state.supply.value) ? [] : [`${state.supply.value} of token ${token} supplied`]),
			...(isZero(state.borrow.value) ? [] : [`${state.borrow.value} of token ${token} borrowed`]),
		]),
		...(isZero(referral.unclaimedRewards) ? [] : [`${referral.unclaimedRewards} USDC unclaimed referral rewards`]),
		...(isZero(referral.builderRewards) ? [] : [`${referral.builderRewards} USDC builder rewards`]),
		...leading.map((vault) => `leads vault ${vault.name} ${vault.address}`),
	];
	for (const dex of dexs.map((entry) => entry?.name ?? "")) {
		const state = await strictRead("clearinghouseState", mainnet.clearinghouseState({ user, dex }));
		const where = dex || "the main dex";
		if (!isZero(state.marginSummary.accountValue)) holdings.push(`${state.marginSummary.accountValue} USDC on ${where}`);
		if (state.assetPositions.length > 0) holdings.push(`${state.assetPositions.length} positions on ${where}`);
	}
	return holdings;
}

function refuseUnlessTestnetUserAction(transport: HttpTransport, typedData: TypedDataJson): void {
	assertTestnet(transport);
	if (typedData.domain?.name !== "HyperliquidSignTransaction") {
		throw new SigningRefused(`refusing typed data for domain ${JSON.stringify(typedData.domain?.name)}`);
	}
	if (!PRINCIPAL_PRIMARY_TYPES.has(typedData.primaryType)) {
		throw new SigningRefused(`refusing principal action ${typedData.primaryType}`);
	}
	if (typedData.message?.hyperliquidChain !== "Testnet") {
		throw new SigningRefused(`refusing hyperliquidChain ${JSON.stringify(typedData.message?.hyperliquidChain)}`);
	}
}

function principalProvider(account: PrivateKeyAccount, transport: HttpTransport) {
	return {
		async request({ method, params }: { method: string; params?: unknown }) {
			switch (method) {
				case "eth_chainId":
					return SIGNATURE_CHAIN_ID;
				case "eth_accounts":
				case "eth_requestAccounts":
					return [account.address];
				case "eth_signTypedData_v4": {
					const [signer, json] = params as [string, string];
					if (signer.toLowerCase() !== account.address.toLowerCase()) {
						throw new SigningRefused(`signer ${signer} is not the principal`);
					}
					const typedData = JSON.parse(json) as TypedDataJson;
					refuseUnlessTestnetUserAction(transport, typedData);
					const { EIP712Domain: _domain, ...types } = typedData.types;
					return account.signTypedData({
						domain: typedData.domain,
						types,
						primaryType: typedData.primaryType,
						message: typedData.message,
					});
				}
				default:
					throw new SigningRefused(`principal wallet refuses ${method}`);
			}
		},
	};
}

export function principalWallet(account: PrivateKeyAccount, transport: HttpTransport) {
	const client = createWalletClient({ account: account.address, transport: custom(principalProvider(account, transport)) });
	const wallet = toHyperliquidWallet(client);
	if (!wallet) throw new Error("the app wallet adapter returned no wallet");
	return wallet;
}

export function agentWallet(account: PrivateKeyAccount, transport: HttpTransport) {
	const wallet = createL1AgentWallet(account);
	return {
		address: wallet.address,
		async signTypedData(params: AgentSignParams): Promise<Hex> {
			assertTestnet(transport);
			const source = (params.message as { source?: unknown } | undefined)?.source;
			const isTestnetL1 =
				params.primaryType === "Agent" &&
				params.domain?.name === "Exchange" &&
				Number(params.domain?.chainId) === 1337 &&
				source === "b";
			if (!isTestnetL1) throw new SigningRefused(`agent refuses ${String(params.primaryType)} with source ${String(source)}`);
			return wallet.signTypedData(params);
		},
	};
}

export function createHarness(transport: HttpTransport, keys: HarnessKeys): Harness {
	assertTestnet(transport);
	const principalAccount = privateKeyToAccount(keys.principalKey);
	const agentAccount = privateKeyToAccount(keys.agentKey);
	return {
		transport,
		info: new InfoClient({ transport }),
		principal: new ExchangeClient({ transport, wallet: principalWallet(principalAccount, transport) }),
		agent: new ExchangeClient({ transport, wallet: agentWallet(agentAccount, transport) }),
		user: principalAccount.address,
		agentAddress: agentAccount.address,
	};
}
