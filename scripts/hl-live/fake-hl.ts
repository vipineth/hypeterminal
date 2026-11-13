import { readFileSync, writeFileSync } from "node:fs";

export interface FakeAccount {
	mode: "disabled" | "unifiedAccount";
	spotUsdc: number;
	collateral: Record<string, number>;
	positions: { coin: string; szi: number }[];
	orders: { coin: string; oid: number }[];
	agents: string[];
	exchange: string[];
}

const MAINNET = "https://api.hyperliquid.xyz";
const TESTNET = "https://api.hyperliquid-testnet.xyz";
const USDC = { name: "USDC", index: 0, szDecimals: 8, weiDecimals: 8, tokenId: "0x6d1e7cde53ba9467b783cb7c530ce054" };
const PURR = { name: "PURR", index: 1, szDecimals: 0, weiDecimals: 5, tokenId: "0xc4bf3f870c0e9465323c0b6ed28096c2" };
const PERP_DEXES: Record<string, { name: string; szDecimals: number; markPx: string }> = {
	"": { name: "DOGE", szDecimals: 0, markPx: "0.2" },
	xyz: { name: "xyz:NVDA", szDecimals: 2, markPx: "180" },
};
const DEX_NAMES = Object.keys(PERP_DEXES);
const SPOT_ASSET_BASE = 10_000;
const BUILDER_ASSET_BASE = 100_000;
const BUILDER_SLOTS = 10_000;

const emptyPerp = { marginSummary: { accountValue: "0.0" }, withdrawable: "0.0", assetPositions: [] };

const mainnetReads: Record<string, unknown> = {
	spotClearinghouseState: { balances: [] },
	perpDexs: [null],
	clearinghouseState: emptyPerp,
	delegatorSummary: { delegated: "0.0", undelegated: "0.0", totalPendingWithdrawal: "0.0", nPendingWithdrawals: 0 },
	userVaultEquities: [],
	subAccounts: null,
	borrowLendUserState: { tokenToState: [], health: "healthy", healthFactor: null },
	referral: { unclaimedRewards: "0.0", builderRewards: "0.0" },
	leadingVaults: [],
};

function statePath(): string {
	const path = process.env.FAKE_HL_STATE;
	if (!path) throw new Error("FAKE_HL_STATE must name the fake account file");
	return path;
}

const path = statePath();
const account = JSON.parse(readFileSync(path, "utf8")) as FakeAccount;

function save(): void {
	writeFileSync(path, JSON.stringify(account));
}

function coinOfAsset(asset: number): string {
	if (asset >= BUILDER_ASSET_BASE) return PERP_DEXES[DEX_NAMES[Math.floor((asset - BUILDER_ASSET_BASE) / BUILDER_SLOTS)]].name;
	if (asset >= SPOT_ASSET_BASE) return "PURR/USDC";
	return PERP_DEXES[""].name;
}

function dexOfCoin(coin: string): string {
	return coin.includes(":") ? coin.split(":")[0] : "";
}

function balance(dex: string): number {
	return dex === "spot" ? account.spotUsdc : (account.collateral[dex] ?? 0);
}

function setBalance(dex: string, value: number): void {
	if (dex === "spot") account.spotUsdc = value;
	else account.collateral[dex] = value;
}

function perpState(dex: string) {
	const value = String(balance(dex));
	const positions = account.positions.filter((position) => dexOfCoin(position.coin) === dex && position.szi !== 0);
	return {
		marginSummary: { accountValue: value },
		withdrawable: value,
		assetPositions: positions.map((position) => ({ position: { coin: position.coin, szi: String(position.szi) } })),
	};
}

function testnetInfo(request: { type: string; dex?: string }): unknown {
	const dex = request.dex ?? "";
	switch (request.type) {
		case "userAbstraction":
			return account.mode;
		case "perpDexs":
			return DEX_NAMES.map((name) => (name === "" ? null : { name }));
		case "clearinghouseState":
			return PERP_DEXES[dex] ? perpState(dex) : emptyPerp;
		case "spotClearinghouseState":
			return { balances: [{ coin: "USDC", token: 0, total: String(account.spotUsdc), hold: "0.0", entryNtl: "0.0" }] };
		case "spotMeta":
			return { tokens: [USDC, PURR], universe: [{ name: "PURR/USDC", index: 0, tokens: [1, 0], isCanonical: true }] };
		case "spotMetaAndAssetCtxs":
			return [{ tokens: [USDC, PURR], universe: [{ name: "PURR/USDC", index: 0, tokens: [1, 0], isCanonical: true }] }, [{ markPx: "0.1" }]];
		case "metaAndAssetCtxs": {
			const market = PERP_DEXES[dex];
			return [{ universe: [{ name: market.name, szDecimals: market.szDecimals, maxLeverage: 10 }] }, [{ markPx: market.markPx }]];
		}
		case "frontendOpenOrders":
			return account.orders
				.filter((order) => dex === "ALL_DEXS" || dexOfCoin(order.coin) === dex)
				.map((order) => ({ coin: order.coin, oid: order.oid, side: "B", limitPx: "1", sz: "1", isTrigger: false, orderType: "Limit", tif: "Gtc" }));
		case "twapHistory":
			return [];
		case "extraAgents":
			return account.agents.map((address) => ({ name: "hl-live", address, validUntil: 0 }));
		default:
			throw new Error(`the fake testnet has no ${request.type}`);
	}
}

type Action = { type: string } & Record<string, unknown>;

function fill(order: { a: number; b: boolean; s: string; r: boolean }) {
	const coin = coinOfAsset(order.a);
	const position = account.positions.find((entry) => entry.coin === coin);
	const delta = order.b ? Number(order.s) : -Number(order.s);
	if (order.r && (!position || Math.abs(position.szi + delta) > Math.abs(position.szi))) return { error: "Reduce only order would increase position" };
	if (position) position.szi += delta;
	else account.positions.push({ coin, szi: delta });
	return { filled: { totalSz: order.s, avgPx: "1", oid: 1 } };
}

function exchange(action: Action): unknown {
	account.exchange.push(action.type);
	const ok = (type = "default") => ({ status: "ok", response: { type } });
	switch (action.type) {
		case "order":
			return { status: "ok", response: { type: "order", data: { statuses: (action.orders as Parameters<typeof fill>[0][]).map(fill) } } };
		case "cancel": {
			const oids = new Set((action.cancels as { o: number }[]).map((cancel) => cancel.o));
			account.orders = account.orders.filter((order) => !oids.has(order.oid));
			return { status: "ok", response: { type: "cancel", data: { statuses: [...oids].map(() => "success") } } };
		}
		case "updateLeverage":
			return ok();
		case "userSetAbstraction": {
			if (action.abstraction === "unifiedAccount") {
				account.spotUsdc += account.collateral[""] ?? 0;
				account.collateral[""] = 0;
				account.mode = "unifiedAccount";
				return ok();
			}
			const open = account.positions.some((position) => position.szi !== 0) || account.orders.length > 0;
			if (open) return { status: "err", response: "Cannot leave unified account with open positions or orders" };
			account.mode = "disabled";
			return ok();
		}
		case "sendAsset": {
			const amount = Number(action.amount);
			const from = String(action.sourceDex);
			const to = String(action.destinationDex);
			if (balance(from) < amount) return { status: "err", response: `Insufficient balance on ${from || "perp"}` };
			setBalance(from, balance(from) - amount);
			setBalance(to, balance(to) + amount);
			return ok();
		}
		default:
			return { status: "err", response: `the fake testnet has no ${action.type}` };
	}
}

globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
	const url = input instanceof Request ? input.url : String(input);
	const body = JSON.parse(String(init?.body));
	if (url === `${MAINNET}/info`) {
		if (!(body.type in mainnetReads)) throw new Error(`the fake mainnet has no ${body.type}`);
		return Response.json(mainnetReads[body.type]);
	}
	if (url === `${TESTNET}/info`) return Response.json(testnetInfo(body));
	if (url === `${TESTNET}/exchange`) {
		const response = exchange(body.action);
		save();
		return Response.json(response);
	}
	throw new Error(`the fake refuses ${url}`);
}) as typeof fetch;
