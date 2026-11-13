import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ExchangeClient, type HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { createWalletClient, custom, type Hex, type TypedDataDomain } from "viem";
import { generatePrivateKey, type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { createL1AgentWallet } from "../../packages/hl-react/src/signing/l1-agent-wallet.ts";
import { toHyperliquidWallet } from "../../packages/hl-react/src/wallet.ts";

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

export function loadKeys(env: NodeJS.ProcessEnv = process.env): HarnessKeys {
	const file = readEnvFile(env.HL_ENV_FILE ?? mainCheckoutEnvFile());
	const read = (name: string) => env[name] ?? file.get(name);
	const selector = env.HL_PRINCIPAL ?? "";
	const agentKey = parseKey("HL_TESTNET_AGENT_KEY", read("HL_TESTNET_AGENT_KEY"));
	if (selector === "fresh") return { principalKey: generatePrivateKey(), agentKey };
	if (!PRINCIPAL_SELECTOR.test(selector)) throw new Error("HL_PRINCIPAL must be digits or fresh");
	const name = `HL_TESTNET_PRINCIPAL${selector === "1" ? "" : selector}_KEY`;
	return { principalKey: parseKey(name, read(name)), agentKey };
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
