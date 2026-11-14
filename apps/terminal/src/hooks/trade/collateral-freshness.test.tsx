import { readFileSync } from "node:fs";
import { serializeKey, subscriptionKeys } from "@hypeterminal/hl-react";
import { createHyperliquidConfig } from "@hypeterminal/hl-react/create-config";
import { createHyperliquidStore, type HyperliquidStore } from "@hypeterminal/hl-react/store";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { getTradeCollateral } from "@/domain/trade/account-mode";
import { getSpendLimit } from "@/domain/trade/balances";
import { useAccountState } from "@/hooks/trade/use-account-balances";
import { useAssetLeverage } from "@/hooks/trade/use-asset-leverage";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { bumpCollateralGeneration, trackCollateralReceipts } from "@/stores/use-collateral-generation-store";
import { clearinghouse } from "@/test/account-fixture";
import { mountHooks } from "@/test/hook-instance";

const net = vi.hoisted(() => ({
	address: "0x00000000000000000000000000000000000000a1" as `0x${string}`,
	market: undefined as unknown,
	store: null as unknown as HyperliquidStore,
	updateLeverage: async () => ({}),
	resetMutation: () => {},
}));

vi.mock("wagmi", () => ({ useConnection: () => ({ address: net.address, isConnected: true }) }));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSelectedMarketInfo: () => ({ data: net.market }),
	useUserPositions: () => ({ hasPosition: () => false }),
	useExchange: () => ({
		mutateAsync: () => net.updateLeverage(),
		isPending: false,
		error: null,
		reset: net.resetMutation,
	}),
	useSubscription: (method: string, params: object) => {
		const entry = net.store.getState().subscriptions[serializeKey(subscriptionKeys.method(method, params))];
		return {
			data: entry?.data,
			status: entry?.status ?? "idle",
			error: entry?.error,
			isStale: entry?.isStale ?? false,
		};
	},
}));

vi.mock("@/stores/use-collateral-generation-store", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/stores/use-collateral-generation-store")>();
	return { ...original, useCollateralGeneration: () => original.getCollateralGeneration() };
});

vi.mock("@/stores/use-global-settings-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-global-settings-store")>()),
	useMarginMode: () => "cross",
	useGlobalSettingsActions: () => ({ setMarginMode: () => {} }),
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

function keyOf(method: string, params: object) {
	return serializeKey(subscriptionKeys.method(method, params));
}

function receive(method: string, params: object, data: unknown) {
	const key = keyOf(method, params);
	const state = net.store.getState();
	if (!state.subscriptions[key]) state.acquireSubscription(key, () => new Promise(() => {}));
	net.store.getState().setSubscriptionData(key, data);
}

function receiveMode(abstraction: string | undefined) {
	receive("webData3", { user: net.address }, { userState: abstraction === undefined ? {} : { abstraction } });
}

function receiveSpot(usdc: string, afterMaintenance: string | null) {
	receive(
		"spotState",
		{ user: net.address },
		{
			spotState: {
				balances: [{ coin: "USDC", token: 0, total: usdc, hold: "0.0", entryNtl: "0.0" }],
				...(afterMaintenance === null ? {} : { tokenToAvailableAfterMaintenance: [[0, afterMaintenance]] }),
			},
		},
	);
}

function receivePerps(mainWithdrawable = "0.0") {
	receive(
		"allDexsClearinghouseState",
		{ user: net.address },
		{
			clearinghouseStates: [
				["", clearinghouse(mainWithdrawable)],
				["xyz", clearinghouse("0.0")],
			],
		},
	);
}

function receiveNvdaQuote(available: string, maxSize: string, leverage = 10) {
	receive(
		"activeAssetData",
		{ coin: "xyz:NVDA", user: net.address },
		{
			user: net.address,
			coin: "xyz:NVDA",
			leverage: { type: "cross", value: leverage },
			availableToTrade: [available, available],
			maxTradeSzs: [maxSize, maxSize],
			markPx: "100",
		},
	);
}

function markStale(method: string) {
	const key = keyOf(method, { user: net.address });
	net.store.setState((state) => ({
		subscriptions: { ...state.subscriptions, [key]: { ...state.subscriptions[key], isStale: true } },
	}));
}

interface Props {
	use: () => unknown;
	onValue: (value: unknown) => void;
}

function Probe({ use, onValue }: Props) {
	onValue(use());
	return null;
}

function render<T>(use: () => T): T {
	const values: unknown[] = [];
	renderToString(<Probe use={use} onValue={(value) => values.push(value)} />);
	return values[0] as T;
}

function collateralOn(market: UnifiedMarketInfo) {
	net.market = market;
	return render(() => useOrderEntryData({ market, side: "buy", markPx: 100 })).collateral;
}

function swapLimit(token: string) {
	return render(() => getSpendLimit(useAccountState(), "spot", token));
}

function perpSendLimit() {
	return render(() => getSpendLimit(useAccountState(), "perp", "USDC"));
}

let untrack: () => void;

beforeEach(() => {
	net.updateLeverage = async () => ({});
	net.store = createHyperliquidStore(createHyperliquidConfig());
	untrack = trackCollateralReceipts(net.store);
});

afterEach(() => untrack());

function loadUnified() {
	receiveMode("unifiedAccount");
	receiveSpot("100.0", "100.0");
	receivePerps();
	receiveNvdaQuote("100.0", "10.0");
}

describe("a perp quote from before an account mode change", () => {
	it("counts a quote and spot balance that arrived before the account mode once the mode loads", () => {
		receiveNvdaQuote("100.0", "10.0");
		receiveSpot("100.0", "100.0");
		receivePerps();
		receiveMode("unifiedAccount");

		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "100.0" });
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "100" });
	});

	it("drops a quote that arrived before the account mode once the mode changes", () => {
		receiveNvdaQuote("100.0", "10.0");
		expect(collateralOn(NVDA).status).toBe("pending");

		receiveMode("unifiedAccount");
		receiveSpot("100.0", "100.0");
		receivePerps();
		collateralOn(NVDA);

		receiveMode("disabled");
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		receiveNvdaQuote("0.0", "0.0");
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "0.0", shortfall: { kind: "dexEmpty" } });
	});

	it("does not revive a quote when the mode changes away and back", () => {
		loadUnified();
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "100.0", maxSize: "10.0" });

		receiveMode("disabled");
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		receiveMode("unifiedAccount");
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		receiveNvdaQuote("60.0", "6.0");
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "60.0" });
	});

	it("drops a quote once the account stream goes away and comes back", () => {
		loadUnified();
		expect(collateralOn(NVDA).status).toBe("ready");

		net.store.getState().releaseSubscription(keyOf("webData3", { user: net.address }));
		receiveMode("unifiedAccount");
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });
	});
});

describe("spot balances the exchange may no longer honour", () => {
	it("holds a spot buy while the spot balance stream is stale", () => {
		loadUnified();
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "100" });

		markStale("spotState");
		expect(collateralOn(HYPE_USDC).status).toBe("pending");
	});

	it("holds a spot buy when a spot push lands before a rejection and renders after it", () => {
		loadUnified();
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "100" });

		receiveSpot("100.0", "100.0");
		receivePerps();
		bumpCollateralGeneration();
		expect(collateralOn(HYPE_USDC).status).toBe("pending");

		receiveSpot("100.0", "40.0");
		receivePerps();
		expect(collateralOn(HYPE_USDC)).toMatchObject({ status: "ready", available: "40" });
	});

	it("holds a perp quote that lands before a rejection and renders after it", () => {
		loadUnified();
		expect(collateralOn(NVDA).status).toBe("ready");

		receiveNvdaQuote("100.0", "10.0");
		bumpCollateralGeneration();
		expect(collateralOn(NVDA)).toEqual({ status: "pending", reason: "quote" });

		receiveNvdaQuote("60.0", "6.0");
		expect(collateralOn(NVDA)).toMatchObject({ status: "ready", available: "60.0" });
	});
});

describe("the swap and send limits after a rejection", () => {
	it("stops offering the cached spot balance to the swap until fresh capacity arrives", () => {
		loadUnified();
		expect(swapLimit("USDC")).toEqual({ status: "ready", amount: "100" });

		bumpCollateralGeneration();
		expect(swapLimit("USDC")).toEqual({ status: "pending" });

		receiveSpot("100.0", "50.0");
		receivePerps();
		expect(swapLimit("USDC")).toEqual({ status: "ready", amount: "50" });
	});

	it("holds a perp send on a standard account until both balances are pushed again", () => {
		receiveMode("disabled");
		receiveSpot("10.0", null);
		receivePerps("80.0");
		expect(perpSendLimit()).toEqual({ status: "ready", amount: "80.0" });

		bumpCollateralGeneration();
		receiveSpot("10.0", null);
		expect(perpSendLimit()).toEqual({ status: "pending" });

		receivePerps("30.0");
		expect(perpSendLimit()).toEqual({ status: "ready", amount: "30.0" });
	});
});

describe("leverage applied from this tab", () => {
	function nvdaCollateral(quote: ReturnType<typeof useAssetLeverage>["quote"]) {
		return getTradeCollateral(render(useAccountState), NVDA, "buy", quote);
	}

	it("sizes from a quote received after the apply settled when another tab changed leverage since", async () => {
		loadUnified();
		net.market = NVDA;
		const leverage = mountHooks(useAssetLeverage);

		await leverage().applyMarginAndLeverage("cross", 20);
		receiveSpot("100.0", "100.0");
		receivePerps();
		receiveNvdaQuote("100.0", "10.0", 5);

		const hook = leverage();
		expect(hook.currentLeverage).toBe(5);
		expect(nvdaCollateral(hook.quote)).toMatchObject({ status: "ready", available: "100.0", maxSize: "10.0" });
	});

	it("does not size from a quote received while the apply was in flight", async () => {
		loadUnified();
		net.market = NVDA;
		let settle = () => {};
		net.updateLeverage = () => new Promise((resolve) => (settle = () => resolve({})));
		const leverage = mountHooks(useAssetLeverage);

		const applying = leverage().applyMarginAndLeverage("cross", 20);
		receiveNvdaQuote("100.0", "10.0", 10);
		settle();
		await applying;
		expect(nvdaCollateral(leverage().quote)).toEqual({ status: "pending", reason: "quote" });

		receiveSpot("100.0", "100.0");
		receivePerps();
		receiveNvdaQuote("100.0", "20.0", 20);
		expect(nvdaCollateral(leverage().quote)).toMatchObject({ status: "ready", maxSize: "20.0" });
	});

	it.each<[string, (hook: () => ReturnType<typeof useAssetLeverage>) => Promise<void>]>([
		["applying margin and leverage", (hook) => hook().applyMarginAndLeverage("cross", 5)],
		["switching margin mode", (hook) => hook().switchMarginMode("isolated")],
		[
			"confirming a leverage change",
			(hook) => {
				hook().setPendingLeverage(5);
				return hook().confirmLeverage();
			},
		],
	])("holds the old quote after %s when the exchange applied it but the response was lost", async (_, change) => {
		loadUnified();
		net.market = NVDA;
		let exchangeApplied = false;
		net.updateLeverage = async () => {
			exchangeApplied = true;
			throw new Error("Leverage applied, response lost");
		};
		const leverage = mountHooks(useAssetLeverage);
		expect(nvdaCollateral(leverage().quote)).toMatchObject({ status: "ready", maxSize: "10.0" });

		await expect(change(leverage)).rejects.toThrow("response lost");
		expect(exchangeApplied).toBe(true);
		expect(nvdaCollateral(leverage().quote)).toEqual({ status: "pending", reason: "quote" });
	});
});
