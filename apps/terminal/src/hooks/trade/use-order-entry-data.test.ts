import Big from "big.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildOrderPlan } from "@/domain/trade/order-intent";
import { useOrderEntryData } from "@/hooks/trade/use-order-entry-data";
import { validateSpotOrder } from "@/lib/errors/stacks/spot-order";
import type { UnifiedMarketInfo } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import type { SizeMode } from "@/lib/trade/types";

const form = vi.hoisted(() => ({ orderType: "limit", limitPrice: "200" }));

vi.mock("wagmi", () => ({ useConnection: () => ({ isConnected: true }) }));

vi.mock("@/hooks/trade/use-account-balances", () => ({
	useDefaultDexBalances: () => ({
		spotBalances: [{ coin: "USDC", token: 0, total: "150", hold: "0", entryNtl: "0" }],
		spotAvailableAfterMaintenance: null,
	}),
}));

vi.mock("@/hooks/trade/use-asset-leverage", () => ({
	useAssetLeverage: () => ({ maxTradeSzs: null, availableToTrade: null }),
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useOrderType: () => form.orderType,
	useLimitPrice: () => form.limitPrice,
	useTriggerPrice: () => "",
	useScaleStart: () => "",
	useScaleEnd: () => "",
}));

const HYPE_USDC = {
	kind: "spot",
	name: "@107",
	pairName: "HYPE/USDC",
	assetId: 10107,
	szDecimals: 2,
	tokensInfo: [
		{ name: "HYPE", displayName: "HYPE" },
		{ name: "USDC", displayName: "USDC" },
	],
} as unknown as UnifiedMarketInfo;

const MARK = 100;
const LIMIT = 200;
const QUOTE_BALANCE = 150;

function submitLimitBuy(sizeMode: SizeMode, sizeInput: string) {
	// biome-ignore lint/correctness/useHookAtTopLevel: its React inputs are mocked, so the hook runs as a plain function
	const entry = useOrderEntryData({ market: HYPE_USDC, side: "buy", markPx: MARK, sizeMode, sizeInput });
	const plan = buildOrderPlan({
		kind: "entry",
		assetId: HYPE_USDC.assetId,
		side: "buy",
		orderType: "limit",
		sizeValue: entry.sizeValue,
		szDecimals: HYPE_USDC.szDecimals,
		marketKind: "spot",
		markPx: MARK,
		price: LIMIT,
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
		tpPriceNum: null,
		slPriceNum: null,
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
