import Big from "big.js";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCALE_LEVELS_MAX, SCALE_LEVELS_MIN } from "@/config/trade";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { validateSpotOrder } from "@/lib/errors/stacks/spot-order";
import type { SpotMarketInfo, UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { SizeMode } from "@/lib/trade/types";

const form = vi.hoisted(() => ({
	orderType: "limit",
	limitPrice: "200",
	scaleStart: "",
	scaleEnd: "",
	quoteBalance: "150",
	sizeMode: "base" as SizeMode,
	size: "",
	sizeUnit: null as { mode: SizeMode; assetId: number; szDecimals: number } | null,
}));

vi.mock("wagmi", () => ({ useConnection: () => ({ isConnected: true }) }));

vi.mock("@/hooks/trade/use-account-balances", () => ({
	useDefaultDexBalances: () => ({
		spotBalances: [{ coin: "USDC", token: 0, total: form.quoteBalance, hold: "0", entryNtl: "0" }],
		spotAvailableAfterMaintenance: null,
	}),
}));

vi.mock("@/hooks/trade/use-asset-leverage", () => ({
	useAssetLeverage: () => ({ maxTradeSzs: null, availableToTrade: null }),
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useSizeMode: () => form.sizeMode,
	useOrderSize: () => form.size,
	useOrderSizeUnit: () => form.sizeUnit,
	useOrderEntryActions: () => ({ setSize: () => {}, setSizeMode: () => {} }),
	useOrderType: () => form.orderType,
	useLimitPrice: () => form.limitPrice,
	useTriggerPrice: () => "",
	useScaleStart: () => form.scaleStart,
	useScaleEnd: () => form.scaleEnd,
}));

const HYPE_USDC = {
	kind: "spot",
	name: "@107",
	pairName: "HYPE/USDC",
	assetId: 10107,
	szDecimals: 2,
	base: { name: "HYPE", displayName: "HYPE" },
	quote: { name: "USDC", displayName: "USDC" },
} as unknown as SpotMarketInfo;

const MARK = 100;
const LIMIT = 200;
const QUOTE_BALANCE = 150;

type OrderEntry = ReturnType<typeof useOrderEntryData>;

interface Props {
	market: UnifiedMarketInfo;
	onEntry: (entry: OrderEntry) => void;
}

function OrderEntryProbe({ market, onEntry }: Props) {
	onEntry(useOrderEntryData({ market, side: "buy", markPx: MARK }));
	return null;
}

function renderOrderEntry(market: UnifiedMarketInfo, sizeMode: SizeMode, sizeInput: string): OrderEntry {
	form.sizeMode = sizeMode;
	form.size = sizeInput;
	form.sizeUnit = { mode: sizeMode, assetId: market.assetId, szDecimals: market.szDecimals };
	const entries: OrderEntry[] = [];
	renderToString(<OrderEntryProbe market={market} onEntry={(entry) => entries.push(entry)} />);
	return entries[0];
}

function submitLimitBuy(sizeMode: SizeMode, sizeInput: string) {
	const entry = renderOrderEntry(HYPE_USDC, sizeMode, sizeInput);
	const plan = buildOrderPlan({
		kind: "entry",
		market: HYPE_USDC,
		side: "buy",
		orderType: "limit",
		sizeValue: entry.orderSize,
		markPx: String(MARK),
		slippageBps: 250,
		reduceOnly: false,
		tif: "Gtc",
		limitPriceInput: String(LIMIT),
		triggerPriceInput: "",
		scaleStartPriceInput: "",
		scaleEndPriceInput: "",
		scaleLevelsNum: null,
		tpSlEnabled: false,
		canUseTpSl: false,
		tpPriceInput: "",
		slPriceInput: "",
	});
	const validation = validateSpotOrder({
		isConnected: true,
		isWalletLoading: false,
		isReadyToTrade: true,
		needsAgentApproval: false,
		availableBalance: entry.availableBalance,
		hasMarket: true,
		hasAssetIndex: true,
		side: "buy",
		usesLimitPrice: true,
		price: LIMIT,
		sizeValue: entry.sizeValue,
		orderValue: entry.orderValue,
		baseAvailable: entry.spotBalance.baseAvailable,
		quoteAvailable: entry.spotBalance.quoteAvailable,
		baseToken: entry.baseToken,
		quoteToken: entry.quoteToken,
	});
	const [order] = plan.orders;
	const wireNotional = order ? Big(order.s).times(order.p).toNumber() : 0;
	return { canSubmit: validation.canSubmit, wireNotional };
}

describe("quote-sized limit orders", () => {
	beforeEach(() => {
		form.orderType = "limit";
		form.limitPrice = String(LIMIT);
		form.quoteBalance = String(QUOTE_BALANCE);
	});

	it("sizes 100 USDC at a 200 limit so the wire notional is the typed 100, not 200", () => {
		const { canSubmit, wireNotional } = submitLimitBuy("quote", "100");
		expect(wireNotional).toBeLessThanOrEqual(100);
		expect(wireNotional).toBeGreaterThan(99);
		expect(canSubmit).toBe(true);
	});

	it("blocks a 1 unit limit buy at 200 when the balance is 150, even though mark says 100", () => {
		const { canSubmit, wireNotional } = submitLimitBuy("base", "1");
		expect(wireNotional).toBe(200);
		expect(canSubmit).toBe(false);
	});

	it("never lets a submittable limit buy carry more wire notional than the quote balance", () => {
		for (const [sizeMode, sizeInput] of [
			["quote", "100"],
			["quote", "150"],
			["base", "0.75"],
			["base", "1"],
		] as const) {
			const { canSubmit, wireNotional } = submitLimitBuy(sizeMode, sizeInput);
			if (canSubmit) expect(wireNotional).toBeLessThanOrEqual(QUOTE_BALANCE);
		}
	});
});

const SCALE_RANGES = [
	["20", "10"],
	["10", "20"],
	["1.2345", "0.98765"],
	["0.98765", "1.2345"],
] as const;

const SCALE_QUOTES = ["270", "999.99", "1234.56", "5000"];

function buildScaleBuy(market: SpotMarketInfo, entry: OrderEntry, levels: number) {
	return buildOrderPlan({
		kind: "entry",
		market,
		side: "buy",
		orderType: "scale",
		sizeValue: entry.orderSize,
		markPx: String(MARK),
		slippageBps: 250,
		reduceOnly: false,
		tif: "Gtc",
		limitPriceInput: "",
		triggerPriceInput: "",
		scaleStartPriceInput: form.scaleStart,
		scaleEndPriceInput: form.scaleEnd,
		scaleLevelsNum: levels,
		tpSlEnabled: false,
		canUseTpSl: false,
		tpPriceInput: "",
		slPriceInput: "",
	});
}

describe("quote-sized scale buys", () => {
	beforeEach(() => {
		form.orderType = "scale";
		form.quoteBalance = "1000000";
	});

	it("never send more than the typed USDC or the order value the balance check uses", () => {
		const misses: string[] = [];
		let sent = 0;
		for (const market of [{ ...HYPE_USDC, szDecimals: 0 }, HYPE_USDC]) {
			for (let levels = SCALE_LEVELS_MIN; levels <= SCALE_LEVELS_MAX; levels += 1) {
				for (const [start, end] of SCALE_RANGES) {
					for (const quote of SCALE_QUOTES) {
						form.scaleStart = start;
						form.scaleEnd = end;
						const entry = renderOrderEntry(market, "quote", quote);
						const plan = buildScaleBuy(market, entry, levels);
						if (plan.orders.length === 0) continue;
						sent += 1;
						const wire = plan.orders.reduce((total, order) => total.plus(Big(order.s).times(order.p)), Big(0));
						if (wire.gt(quote) || wire.gt(entry.orderValue)) {
							misses.push(
								`sz ${market.szDecimals} ${start}->${end} x${levels} ${quote}: wire ${wire}, value ${entry.orderValue}`,
							);
						}
					}
				}
			}
		}
		expect(misses).toEqual([]);
		expect(sent).toBeGreaterThan(400);
	});
});
