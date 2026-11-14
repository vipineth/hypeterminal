import { mkdirSync, writeFileSync } from "node:fs";
import type {
	ActiveAssetDataResponse,
	AllDexsClearinghouseStateWsEvent,
	SpotClearinghouseStateResponse,
	WebData3WsEvent,
} from "@nktkas/hyperliquid";
import type { AccountFixture } from "../../apps/terminal/src/test/account-fixture.ts";

const NETWORKS = {
	mainnet: { info: "https://api.hyperliquid.xyz/info", ws: "wss://api.hyperliquid.xyz/ws" },
	testnet: { info: "https://api.hyperliquid-testnet.xyz/info", ws: "wss://api.hyperliquid-testnet.xyz/ws" },
} as const;
const FIXTURE_DIR = new URL("../../apps/terminal/src/domain/trade/__fixtures__/account/", import.meta.url).pathname;
const KEPT_DEXES = new Set(["", "xyz", "flx"]);
const QUOTE_COINS = ["BTC", "xyz:NVDA"];

type Network = keyof typeof NETWORKS;

function infoReader(network: Network) {
	const url = NETWORKS[network].info;
	if (!url.endsWith("/info")) throw new Error(`capture is read-only and refuses ${url}`);
	return async function info<T>(body: Record<string, string>): Promise<T> {
		const response = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!response.ok) throw new Error(`info ${JSON.stringify(body)} returned HTTP ${response.status}`);
		return (await response.json()) as T;
	};
}

interface StreamSnapshot {
	webData3UserState: WebData3WsEvent["userState"];
	clearinghouseStates: AllDexsClearinghouseStateWsEvent["clearinghouseStates"];
}

function readStreams(network: Network, user: string): Promise<StreamSnapshot> {
	return new Promise((resolve, reject) => {
		const socket = new WebSocket(NETWORKS[network].ws);
		const seen: Partial<StreamSnapshot> = {};
		const timer = setTimeout(() => reject(new Error("account streams sent nothing in 15 s")), 15_000);
		socket.onopen = () => {
			for (const type of ["webData3", "allDexsClearinghouseState"]) {
				socket.send(JSON.stringify({ method: "subscribe", subscription: { type, user } }));
			}
		};
		socket.onmessage = (event) => {
			const message = JSON.parse(String(event.data));
			if (message.channel === "webData3") seen.webData3UserState = message.data.userState;
			if (message.channel === "allDexsClearinghouseState") seen.clearinghouseStates = message.data.clearinghouseStates;
			if (!seen.webData3UserState || !seen.clearinghouseStates) return;
			clearTimeout(timer);
			socket.close();
			resolve({ webData3UserState: seen.webData3UserState, clearinghouseStates: seen.clearinghouseStates });
		};
		socket.onerror = () => reject(new Error("account stream socket failed"));
	});
}

export async function captureAccount(network: Network, user: string): Promise<AccountFixture> {
	const info = infoReader(network);
	const streams = await readStreams(network, user);
	const activeAssetData: Record<string, ActiveAssetDataResponse> = {};
	for (const coin of QUOTE_COINS) {
		activeAssetData[coin] = await info<ActiveAssetDataResponse>({ type: "activeAssetData", user, coin });
	}
	return {
		network,
		user,
		capturedAt: new Date().toISOString(),
		userAbstraction: await info<string | null>({ type: "userAbstraction", user }),
		webData3UserState: streams.webData3UserState,
		spot: await info<SpotClearinghouseStateResponse>({ type: "spotClearinghouseState", user }),
		clearinghouseStates: streams.clearinghouseStates.filter(
			([dex, state]) =>
				KEPT_DEXES.has(dex) || Number(state.marginSummary.accountValue) !== 0 || state.assetPositions.length > 0,
		),
		activeAssetData,
	};
}

if (import.meta.main) {
	const [name, network, user] = process.argv.slice(2);
	if (!name || (network !== "mainnet" && network !== "testnet") || !/^0x[0-9a-fA-F]{40}$/.test(user ?? "")) {
		throw new Error("usage: bun scripts/hl-live/capture-account.ts <name> <mainnet|testnet> <address>");
	}
	const fixture = await captureAccount(network, user);
	mkdirSync(FIXTURE_DIR, { recursive: true });
	writeFileSync(`${FIXTURE_DIR}${name}.json`, `${JSON.stringify(fixture, null, "\t")}\n`);
	console.log(`${name}: ${fixture.userAbstraction ?? "null"}, ${fixture.clearinghouseStates.length} dexes kept`);
}
