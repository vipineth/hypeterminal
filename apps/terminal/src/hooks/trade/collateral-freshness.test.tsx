import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { clearinghouse } from "@/test/account-fixture";

interface Feed {
	data: unknown;
	status: "active" | "subscribing" | "idle" | "error";
	isStale: boolean;
}

const net = vi.hoisted(() => ({
	address: "0x00000000000000000000000000000000000000a1" as `0x${string}`,
	market: undefined as unknown,
	feeds: {} as Record<string, Feed>,
	generation: 0,
}));

vi.mock("wagmi", () => ({ useConnection: () => ({ address: net.address, isConnected: true }) }));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSelectedMarketInfo: () => ({ data: net.market }),
	useUserPositions: () => ({ hasPosition: () => false }),
	useExchange: () => ({ mutateAsync: async () => ({}), isPending: false, error: null, reset: () => {} }),
	useSubscription: (method: string) => net.feeds[method] ?? { data: undefined, status: "idle", isStale: false },
}));

vi.mock("@/stores/use-collateral-generation-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-collateral-generation-store")>()),
	useCollateralGeneration: () => net.generation,
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useSizeMode: () => "base",
	useOrderSize: () => "",
	useOrderSizeUnit: () => null,
	useOrderEntryActions: () => ({ setSize: () => {}, setSizeMode: () => {} }),
	useOrderType: () => "limit",
	useLimitPrice: () => "100",
	useTriggerPrice: () => "",
	useScaleStart: () => "",
	useScaleEnd: () => "",
}));

const model = parseMarkets(
	JSON.parse(readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8")) as MetaPayloads,
);

function marketNamed(name: string): UnifiedMarketInfo {
	const found = model.byName.get(name);
	if (!found) throw new Error(`no market ${name}`);
	return found as unknown as UnifiedMarketInfo;
}

const NVDA = marketNamed("xyz:NVDA");
const HYPE_USDC = marketNamed("@107");

function live(data: unknown): Feed {
	return { data, status: "active", isStale: false };
}

function webData3(abstraction: string | undefined) {
	return live({ userState: abstraction === undefined ? {} : { abstraction } });
}

function spotState(usdc: string, afterMaintenance: string | null) {
	return live({
		spotState: {
			balances: [{ coin: "USDC", token: 0, total: usdc, hold: "0.0", entryNtl: "0.0" }],
			...(afterMaintenance === null ? {} : { tokenToAvailableAfterMaintenance: [[0, afterMaintenance]] }),
		},
	});
}

function perpStates() {
	return live({ clearinghouseStates: [["", clearinghouse("0.0")], ["xyz", clearinghouse("0.0")]] });
}

function nvdaQuote(available: string, maxSize: string) {
	return live({
		user: net.address,
		coin: "xyz:NVDA",
		leverage: { type: "cross", value: 10 },
		availableToTrade: [available, available],
		maxTradeSzs: [maxSize, maxSize],
		markPx: "100",
	});
}

type OrderEntry = ReturnType<typeof useOrderEntryData>;

interface Props {
	market: UnifiedMarketInfo;
	onEntry: (entry: OrderEntry) => void;
}

function OrderEntryProbe({ market, onEntry }: Props) {
	onEntry(useOrderEntryData({ market, side: "buy", markPx: 100 }));
	return null;
}

function collateralOn(market: UnifiedMarketInfo) {
	net.market = market;
	const entries: OrderEntry[] = [];
	renderToString(<OrderEntryProbe market={market} onEntry={(entry) => entries.push(entry)} />);
	return entries[0].collateral;
}

beforeEach(() => {
	net.feeds = {
		webData3: webData3("unifiedAccount"),
		spotState: spotState("100.0", "100.0"),
		allDexsClearinghouseState: perpStates(),
		activeAssetData: nvdaQuote("100.0", "10.0"),
	};
});

describe("a perp quote from before an account mode change", () => {
	it("stops sizing xyz:NVDA once the account leaves unified, until the exchange quotes again", () => {
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "100.0", maxSize: "10.0" });

		net.feeds.webData3 = webData3("disabled");
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		net.feeds.activeAssetData = nvdaQuote("0.0", "0.0");
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "0.0", shortfall: { kind: "dexEmpty" } });
	});
});

describe("spot balances the exchange may no longer honour", () => {
	it("holds a spot buy while the spot balance stream is stale", () => {
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "100" });

		net.feeds.spotState = { ...net.feeds.spotState, isStale: true };
		expect(collateralOn(HYPE_USDC).status).toBe("pending");
	});

	it("holds a spot buy after a collateral rejection until a fresh spot snapshot arrives", () => {
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "100" });

		net.generation += 1;
		expect(collateralOn(HYPE_USDC).status).toBe("pending");

		net.feeds.spotState = spotState("100.0", "40.0");
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "40" });
	});

	it("holds a perp quote seen before a rejection, even in a ticket mounted after it", () => {
		expect(collateralOn(NVDA).status).toBe("ready");

		net.generation += 1;
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		net.feeds.activeAssetData = nvdaQuote("60.0", "6.0");
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "60.0" });
	});
});
