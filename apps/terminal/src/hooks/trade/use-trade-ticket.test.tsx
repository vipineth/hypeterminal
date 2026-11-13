import { ApiRequestError, HttpRequestError } from "@nktkas/hyperliquid";
import Big from "big.js";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTradeTicket } from "@/hooks/trade/use-trade-ticket";

const POINTS_USDC = vi.hoisted(() => ({
	kind: "spot",
	name: "@8",
	pairName: "POINTS/USDC",
	assetId: 10008,
	szDecimals: 0,
	markPx: "0.0026434",
	tokensInfo: [
		{ name: "POINTS", displayName: "POINTS" },
		{ name: "USDC", displayName: "USDC" },
	],
}));

const SOL_PERP = vi.hoisted(() => ({
	kind: "perp",
	name: "SOL",
	pairName: "SOL-USDC",
	assetId: 5,
	szDecimals: 2,
	markPx: "80.276",
}));

const form = vi.hoisted(() => ({
	market: POINTS_USDC as typeof POINTS_USDC | typeof SOL_PERP,
	side: "buy",
	orderType: "limit",
	sizeMode: "base",
	quoteBalance: "1000",
	baseBalance: "0",
	size: "10000",
	limitPrice: "0.0026434",
	triggerPrice: "",
	scaleStart: "",
	scaleEnd: "",
	scaleLevels: 5,
	reduceOnly: false,
	twapMinutes: null as number | null,
	tpSlEnabled: false,
	tpPrice: "",
	slPrice: "",
	sizeUnit: null as { mode: string; assetId: number; szDecimals: number } | null,
	maxTradeSzs: [100, 100],
}));

const liveFeed = vi.hoisted(() => ({ markPx: null as string | null, status: "active", isStale: false }));
const exchange = vi.hoisted(() => ({ placeOrder: vi.fn() }));
const info = vi.hoisted(() => ({ orderStatus: vi.fn() }));
const formActions = vi.hoisted(() => ({ resetForm: vi.fn() }));
const queue = vi.hoisted(() => ({ addOrder: vi.fn(() => "order-1"), updateOrder: vi.fn(), removeOrder: vi.fn() }));

vi.mock("@/stores/use-order-queue-store", () => ({
	useOrderQueueActions: () => queue,
}));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: "0x0000000000000000000000000000000000000001", isConnected: true }),
	useWalletClient: () => ({ data: {}, isLoading: false, error: null }),
	useSwitchChain: () => ({ isPending: false, mutate: () => {} }),
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSelectedMarketInfo: () => ({ data: form.market }),
	useUserPositions: () => ({ getPosition: () => null }),
	useAgentStatus: () => ({ isReady: true, isLoading: false }),
	useAgentRegistration: () => ({ register: async () => {}, status: "ready" }),
	useExchange: () => ({ mutateAsync: exchange.placeOrder, isPending: false }),
	useSubscription: (method: string, params: { coin: string }) => ({
		data:
			method === "activeAssetCtx" && params.coin === form.market.name
				? { ctx: { markPx: liveFeed.markPx ?? form.market.markPx } }
				: undefined,
		status: liveFeed.status,
		isStale: liveFeed.isStale,
	}),
	getInfoClient: () => info,
}));

vi.mock("@/hooks/trade/use-fee-rates", () => ({
	useFeeRates: () => ({ takerRate: 0.0007, makerRate: 0.0004 }),
}));

vi.mock("@/hooks/trade/use-account-balances", () => ({
	useDefaultDexBalances: () => ({
		spotBalances: [
			{ coin: "USDC", token: 0, total: form.quoteBalance, hold: "0", entryNtl: "0" },
			{ coin: "POINTS", token: 9, total: form.baseBalance, hold: "0", entryNtl: "0" },
		],
		spotAvailableAfterMaintenance: null,
	}),
}));

vi.mock("@/hooks/trade/use-asset-leverage", () => ({
	useAssetLeverage: () => ({ maxTradeSzs: form.maxTradeSzs, availableToTrade: [10000, 10000] }),
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useOrderSide: () => form.side,
	useOrderType: () => form.orderType,
	useSizeMode: () => form.sizeMode,
	useReduceOnly: () => form.reduceOnly,
	useOrderSize: () => form.size,
	useOrderSizeUnit: () =>
		form.sizeUnit ?? { mode: form.sizeMode, assetId: form.market.assetId, szDecimals: form.market.szDecimals },
	useLimitPrice: () => form.limitPrice,
	useTriggerPrice: () => form.triggerPrice,
	useScaleStart: () => form.scaleStart,
	useScaleEnd: () => form.scaleEnd,
	useScaleLevels: () => form.scaleLevels,
	useTwapMinutes: () => form.twapMinutes,
	useTwapRandomize: () => false,
	useTpSlEnabled: () => form.tpSlEnabled,
	useTpPrice: () => form.tpPrice,
	useSlPrice: () => form.slPrice,
	useTif: () => "Gtc",
	useOrderEntryActions: () => ({
		resetForm: formActions.resetForm,
		setOrderType: () => {},
		setSizeMode: (mode: string) => {
			form.sizeMode = mode;
		},
		setSize: (size: string, unit?: typeof form.sizeUnit) => {
			form.size = size;
			form.sizeUnit = unit ?? form.sizeUnit;
		},
		setLimitPrice: () => {},
	}),
}));

type Ticket = ReturnType<typeof useTradeTicket>;

interface Props {
	onTicket: (ticket: Ticket) => void;
}

function TicketProbe({ onTicket }: Props) {
	onTicket(useTradeTicket());
	return null;
}

function typeSizeHere(size: string) {
	form.size = size;
	form.sizeUnit = { mode: form.sizeMode, assetId: form.market.assetId, szDecimals: form.market.szDecimals };
}

function renderTicket(): Ticket {
	const tickets: Ticket[] = [];
	renderToString(<TicketProbe onTicket={(ticket) => tickets.push(ticket)} />);
	return tickets[0];
}

async function pressSubmit() {
	const ticket = renderTicket();
	expect(ticket.buttonContent.disabled).toBe(false);
	await ticket.buttonContent.action();
}

function sentOrders() {
	return exchange.placeOrder.mock.calls.map(([action]) => action.orders.map(withoutCloid));
}

function withoutCloid({ c: _cloid, ...order }: { c?: string }) {
	return order;
}

function sentCloids(): string[][] {
	return exchange.placeOrder.mock.calls.map(([action]) => action.orders.map((order: { c?: string }) => order.c));
}

beforeEach(() => {
	liveFeed.markPx = null;
	liveFeed.status = "active";
	liveFeed.isStale = false;
});

function wireNotional(orders: { p: string; s: string }[]): number {
	return orders.reduce((total, order) => total.plus(Big(order.s).times(order.p)), Big(0)).toNumber();
}

describe("spot trade ticket", () => {
	beforeEach(() => {
		form.market = POINTS_USDC;
		form.side = "buy";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.quoteBalance = "1000";
		form.baseBalance = "0";
		form.size = "10000";
		form.limitPrice = "0.0026434";
		form.scaleStart = "";
		form.scaleEnd = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = false;
		form.tpPrice = "";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		formActions.resetForm.mockReset();
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({ response: { data: { statuses: [{ resting: { oid: 1 } }] } } });
	});

	it("sends a spot limit buy at the spot tick, not the coarser perp tick", async () => {
		await pressSubmit();
		expect(sentOrders()).toEqual([
			[{ a: 10008, b: true, p: "0.0026434", s: "10000", r: false, t: { limit: { tif: "Gtc" } } }],
		]);
	});

	it("never sends a limit buy above a typed price that a number cannot hold", async () => {
		form.limitPrice = "0.00264339999999999999";
		await pressSubmit();
		expect(sentOrders()[0][0].p).toBe("0.0026433");
	});

	it("never sends a limit sell below a typed price that a number cannot hold", async () => {
		form.side = "sell";
		form.baseBalance = "20000";
		form.limitPrice = "0.00264340000000000001";
		await pressSubmit();
		expect(sentOrders()[0][0]).toMatchObject({ b: false, p: "0.0026435", s: "10000" });
	});

	it("clears the form after it sends the order", async () => {
		await pressSubmit();
		expect(sentOrders()).toHaveLength(1);
		expect(formActions.resetForm).toHaveBeenCalledTimes(1);
	});

	it("keeps the form when every scale leg is under the minimum and nothing is sent", async () => {
		form.orderType = "scale";
		form.scaleStart = "0.0026";
		form.scaleEnd = "0.0027";
		await pressSubmit();
		expect(sentOrders()).toEqual([]);
		expect(formActions.resetForm).not.toHaveBeenCalled();
	});

	it("keeps a 270 USDC scale buy from 20 down to 10 within the typed 270 on the wire", async () => {
		form.orderType = "scale";
		form.sizeMode = "quote";
		form.size = "270";
		form.scaleStart = "20";
		form.scaleEnd = "10";
		form.quoteBalance = "273";
		await pressSubmit();
		const [orders] = sentOrders();
		expect(orders.map((order: { p: string }) => order.p)).toEqual(["20", "17.5", "15", "12.5", "10"]);
		expect(wireNotional(orders)).toBeLessThanOrEqual(270);
	});
});

describe("perp trade ticket", () => {
	beforeEach(() => {
		form.market = SOL_PERP;
		form.side = "sell";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.size = "1";
		form.limitPrice = "80.276";
		form.triggerPrice = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = true;
		form.tpPrice = "";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({ response: { data: { statuses: [{ resting: { oid: 1 } }] } } });
	});

	it("sends a short's tp and sl from the typed strings a number cannot hold", async () => {
		form.tpPrice = "74.999999999999999";
		form.slPrice = "84.999999999999999";
		await pressSubmit();
		const [orders] = sentOrders();
		expect(orders.slice(1)).toEqual([
			{
				a: 5,
				b: true,
				p: "74.999",
				s: "1",
				r: true,
				t: { trigger: { isMarket: true, triggerPx: "74.999", tpsl: "tp" } },
			},
			{
				a: 5,
				b: true,
				p: "84.999",
				s: "1",
				r: true,
				t: { trigger: { isMarket: true, triggerPx: "85", tpsl: "sl" } },
			},
		]);
	});

	it("shows the triggers it sends in the order toast", async () => {
		form.tpPrice = "74.999999999999999";
		form.slPrice = "84.999999999999999";
		await pressSubmit();
		expect(queue.addOrder).toHaveBeenLastCalledWith(expect.objectContaining({ tpPrice: "74.999", slPrice: "85" }));
	});

	it("shows a stop market's sent trigger in the order toast", async () => {
		form.side = "buy";
		form.orderType = "stopMarket";
		form.tpSlEnabled = false;
		form.triggerPrice = "85.0001";
		await pressSubmit();
		const [[stop]] = sentOrders();
		expect(stop).toMatchObject({ p: "85", t: { trigger: { triggerPx: "85.001", tpsl: "sl" } } });
		expect(queue.addOrder).toHaveBeenLastCalledWith(expect.objectContaining({ price: "85.001" }));
	});
});

describe("perp ticket tp/sl against the live mark and the sent entry price", () => {
	beforeEach(() => {
		form.market = { ...SOL_PERP, markPx: "100" };
		form.side = "buy";
		form.orderType = "market";
		form.sizeMode = "base";
		form.size = "1";
		form.limitPrice = "";
		form.triggerPrice = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = true;
		form.tpPrice = "";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({ response: { data: { statuses: [{ resting: { oid: 1 } }] } } });
	});

	it("blocks a stop the live mark has crossed while the cached mark has not", () => {
		form.market = { ...SOL_PERP, markPx: "110" };
		liveFeed.markPx = "100";
		form.slPrice = "105";
		expect(renderTicket().validation.errors).toEqual(["SL must be below mark"]);
	});

	it("waits for a live mark before sending tp/sl while the feed is quiet or failed", () => {
		form.tpPrice = "120";
		liveFeed.isStale = true;
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
		liveFeed.isStale = false;
		liveFeed.status = "error";
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
	});

	it("still sends a plain order while the mark feed is quiet", async () => {
		form.tpSlEnabled = false;
		liveFeed.isStale = true;
		await pressSubmit();
		expect(sentOrders()).toHaveLength(1);
	});

	it("waits for a live mark the same way on a buy limit and a sell limit", () => {
		form.market = { ...SOL_PERP, markPx: "0" };
		liveFeed.status = "subscribing";
		form.orderType = "limit";
		form.limitPrice = "90";
		form.tpPrice = "120";
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
		form.side = "sell";
		form.limitPrice = "110";
		form.tpPrice = "100";
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
	});

	it("reads a builder market's live mark under its prefixed name", () => {
		form.market = { ...SOL_PERP, kind: "builderPerp", name: "xyz:NVDA", markPx: "180" };
		form.tpPrice = "200";
		expect(renderTicket().validation.errors).toEqual([]);
	});

	it("never sends a long's stop on the same price as the buy limit it sends", () => {
		form.orderType = "limit";
		form.limitPrice = "80.2769";
		form.slPrice = "80.2765";
		expect(renderTicket().validation.errors).toEqual(["SL must be below limit price"]);
	});

	it("never sends a short's stop on the same price as the sell limit it sends", () => {
		form.market = { ...SOL_PERP, markPx: "90" };
		form.side = "sell";
		form.orderType = "limit";
		form.limitPrice = "100.001";
		form.slPrice = "100.002";
		expect(renderTicket().validation.errors).toEqual(["SL must be above limit price"]);
	});

	it("sends a take profit whose typed string rounds above mark", async () => {
		form.tpPrice = "100.00000000000000001";
		await pressSubmit();
		const [orders] = sentOrders();
		expect(orders[1]).toMatchObject({ t: { trigger: { triggerPx: "100.01", tpsl: "tp" } } });
	});

	it("names a stop that rounds to zero on this market's tick as invalid", () => {
		form.market = { ...SOL_PERP, markPx: "0.5" };
		form.size = "50";
		form.slPrice = "0.00001";
		expect(renderTicket().validation.errors).toEqual(["Enter a valid SL price"]);
	});
});

describe("perp ticket trigger orders against the live mark", () => {
	beforeEach(() => {
		form.market = { ...SOL_PERP, markPx: "100" };
		form.side = "buy";
		form.orderType = "stopMarket";
		form.sizeMode = "base";
		form.size = "1";
		form.limitPrice = "";
		form.triggerPrice = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = false;
		form.tpPrice = "";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
	});

	it("blocks a stop the live mark has crossed while the cached mark has not", () => {
		form.market = { ...SOL_PERP, markPx: "90" };
		liveFeed.markPx = "100";
		form.triggerPrice = "95";
		expect(renderTicket().validation.errors).toEqual(["Stop trigger must be above mark"]);
	});

	it("waits for a live mark before sending a trigger order", () => {
		form.market = { ...SOL_PERP, markPx: "0" };
		liveFeed.status = "subscribing";
		form.triggerPrice = "105";
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
		form.market = { ...SOL_PERP, markPx: "100" };
		liveFeed.status = "active";
		liveFeed.isStale = true;
		expect(renderTicket().validation.errors).toEqual(["Waiting for live mark price"]);
	});

	it("tells each trigger order which side of mark its trigger belongs on", () => {
		const cases = [
			["buy", "stopMarket", "95", "Stop trigger must be above mark"],
			["sell", "stopMarket", "105", "Stop trigger must be below mark"],
			["buy", "takeProfitMarket", "105", "Take profit trigger must be below mark"],
			["sell", "takeProfitMarket", "95", "Take profit trigger must be above mark"],
		];
		for (const [side, orderType, triggerPrice, message] of cases) {
			Object.assign(form, { side, orderType, triggerPrice });
			expect(renderTicket().validation.errors).toEqual([message]);
		}
	});

	it("blocks a trigger sitting exactly on mark", () => {
		form.triggerPrice = "100";
		expect(renderTicket().validation.errors).toEqual(["Stop trigger must be above mark"]);
		form.side = "sell";
		form.orderType = "takeProfitMarket";
		expect(renderTicket().validation.errors).toEqual(["Take profit trigger must be above mark"]);
	});

	it("sends a take profit trigger whose typed string rounds above mark", async () => {
		form.side = "sell";
		form.orderType = "takeProfitMarket";
		form.triggerPrice = "100.00000000000000001";
		await pressSubmit();
		const [[order]] = sentOrders();
		expect(order).toMatchObject({ t: { trigger: { triggerPx: "100.01", tpsl: "tp" } } });
	});

	it("names a stop trigger that rounds to zero as invalid", () => {
		form.market = { ...SOL_PERP, markPx: "0.5" };
		form.side = "sell";
		form.triggerPrice = "0.00001";
		expect(renderTicket().validation.errors).toContain("Enter a valid trigger price");
	});
});

describe("size the ticket sends after the size field changes context", () => {
	beforeEach(() => {
		form.market = POINTS_USDC;
		form.side = "buy";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.quoteBalance = "1000";
		form.baseBalance = "0";
		form.size = "";
		form.limitPrice = "0.0026434";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = false;
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({ response: { data: { statuses: [{ resting: { oid: 1 } }] } } });
	});

	it("sends nothing after toggling a USDC size that buys no whole lot", async () => {
		form.market = { ...POINTS_USDC, markPx: "30" };
		form.limitPrice = "30";
		form.sizeMode = "quote";
		typeSizeHere("27.21");
		expect(renderTicket().buttonContent.disabled).toBe(true);
		renderTicket().handleSizeModeToggle();
		await renderTicket().buttonContent.action();
		expect(sentOrders()).toEqual([]);
	});

	it("still sends 1 SOL after toggling 1 SOL to USDC", async () => {
		form.market = SOL_PERP;
		form.limitPrice = "80.271";
		typeSizeHere("1");
		renderTicket().handleSizeModeToggle();
		expect(form.sizeMode).toBe("quote");
		await pressSubmit();
		expect(sentOrders()[0][0]).toMatchObject({ p: "80.271", s: "1" });
	});

	it("sends nothing rather than 9998 after toggling 10000 POINTS to a USDC amount that cannot buy exactly 10000", async () => {
		typeSizeHere("10000");
		renderTicket().handleSizeModeToggle();
		await renderTicket().buttonContent.action();
		expect(sentOrders()).toEqual([]);
	});

	it("sends nothing on SOL for a size typed on POINTS", async () => {
		form.size = "100";
		form.sizeUnit = { mode: "base", assetId: POINTS_USDC.assetId, szDecimals: POINTS_USDC.szDecimals };
		form.market = SOL_PERP;
		form.limitPrice = "80.276";
		await renderTicket().buttonContent.action();
		expect(sentOrders()).toEqual([]);
	});

	it("sends the max perp size when Max is pressed in USDC", async () => {
		form.market = SOL_PERP;
		form.limitPrice = "80.271";
		form.sizeMode = "quote";
		form.maxTradeSzs = [1, 1];
		renderTicket().handleSizePercentApply(100);
		await pressSubmit();
		expect(sentOrders()[0][0]).toMatchObject({ p: "80.271", s: "1" });
	});

	it("sends the whole spot balance when Max is pressed in USDC on a sell", async () => {
		form.market = { ...POINTS_USDC, markPx: "30.004" };
		form.side = "sell";
		form.baseBalance = "1";
		form.limitPrice = "30.004";
		form.sizeMode = "quote";
		renderTicket().handleSizePercentApply(100);
		await pressSubmit();
		expect(sentOrders()[0][0]).toMatchObject({ b: false, p: "30.004", s: "1" });
	});

	it("never sells more than the balance when Max in USDC cannot buy the whole balance exactly", async () => {
		form.side = "sell";
		form.baseBalance = "10000";
		form.sizeMode = "quote";
		renderTicket().handleSizePercentApply(100);
		await pressSubmit();
		expect(sentOrders()[0][0]).toMatchObject({ b: false, s: "9998" });
	});

	it("keeps a USDC Max buy within a balance that has more than two decimals", async () => {
		form.quoteBalance = "1000.005";
		form.sizeMode = "quote";
		renderTicket().handleSizePercentApply(100);
		await pressSubmit();
		const [orders] = sentOrders();
		expect(wireNotional(orders)).toBeLessThanOrEqual(1000.005);
	});
});

describe("order flags a market cannot take", () => {
	beforeEach(() => {
		form.market = SOL_PERP;
		form.side = "buy";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.quoteBalance = "10000";
		form.baseBalance = "0";
		form.size = "";
		form.limitPrice = "80.276";
		form.triggerPrice = "";
		form.reduceOnly = true;
		form.twapMinutes = 30;
		form.tpSlEnabled = true;
		form.tpPrice = "90";
		form.slPrice = "70";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		exchange.placeOrder.mockReset();
		exchange.placeOrder.mockResolvedValue({ response: { data: { statuses: [{ resting: { oid: 1 } }] } } });
	});

	function switchToSpot() {
		form.market = { ...POINTS_USDC, markPx: "30" };
		form.limitPrice = "30";
		typeSizeHere("100");
	}

	it("sends reduce-only and tp/sl on a perp", async () => {
		typeSizeHere("1");
		await pressSubmit();
		const [orders] = sentOrders();
		expect(orders.map((order: { r: boolean }) => order.r)).toEqual([true, true, true]);
		expect(exchange.placeOrder.mock.calls[0][0].grouping).toBe("normalTpsl");
	});

	it("never sends a perp's hidden reduce-only on a spot limit", async () => {
		switchToSpot();
		form.tpSlEnabled = false;
		await pressSubmit();
		expect(sentOrders()).toEqual([[{ a: 10008, b: true, p: "30", s: "100", r: false, t: { limit: { tif: "Gtc" } } }]]);
	});

	it("never sends a perp's hidden reduce-only on a spot twap", async () => {
		switchToSpot();
		form.orderType = "twap";
		await pressSubmit();
		expect(exchange.placeOrder.mock.calls[0][0].twap).toMatchObject({ a: 10008, s: "100", r: false });
	});

	it("never sends a perp's hidden tp/sl on a spot limit", async () => {
		switchToSpot();
		form.reduceOnly = false;
		await pressSubmit();
		expect(exchange.placeOrder.mock.calls[0][0]).toMatchObject({
			orders: [{ a: 10008, b: true, p: "30", s: "100", r: false, t: { limit: { tif: "Gtc" } } }],
			grouping: "na",
		});
	});
});

describe("order legs the ticket reports and retries", () => {
	const TP_REASON = "Invalid TP/SL price. asset=5";
	const FILLED = { filled: { totalSz: "1", avgPx: "80.276", oid: 11 } };
	const UNKNOWN_OID = { status: "unknownOid" };

	function entryFilledTpRejected() {
		const response = { status: "ok", response: { type: "order", data: { statuses: [FILLED, { error: TP_REASON }] } } };
		return new ApiRequestError(response, `order 1: ${TP_REASON}`);
	}

	function timedOut() {
		return new HttpRequestError({ detail: "Request timed out after 10000 ms" });
	}

	function lookup(status: string, isTrigger = false) {
		return { status: "order", order: { status, statusTimestamp: 0, order: { isTrigger } } };
	}

	function filledWith(...rest: unknown[]) {
		return { response: { data: { statuses: [FILLED, ...rest] } } };
	}

	function lastQueueUpdate() {
		return queue.updateOrder.mock.lastCall?.[1];
	}

	async function pressSubmitPastReconcile() {
		const submitted = pressSubmit();
		await vi.advanceTimersByTimeAsync(7000);
		await submitted;
	}

	beforeEach(() => {
		form.market = SOL_PERP;
		form.side = "buy";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.limitPrice = "80.276";
		form.triggerPrice = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = true;
		form.tpPrice = "90";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = [100, 100];
		exchange.placeOrder.mockReset();
		info.orderStatus.mockReset();
		queue.updateOrder.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports an entry that fills with a rejected take profit per leg", async () => {
		typeSizeHere("1");
		exchange.placeOrder.mockRejectedValue(entryFilledTpRejected());
		await pressSubmit();
		expect(lastQueueUpdate()).toEqual({ status: "failed", error: `Entry filled. Take profit rejected: ${TP_REASON}` });
	});

	it("gives every leg its own cloid from one plan id", async () => {
		typeSizeHere("3");
		form.slPrice = "70";
		exchange.placeOrder.mockResolvedValue(filledWith("waitingForTrigger", "waitingForTrigger"));
		await pressSubmit();
		const [cloids] = sentCloids();
		expect(cloids).toHaveLength(3);
		for (const cloid of cloids) expect(cloid).toMatch(/^0x[0-9a-f]{32}$/);
		expect(new Set(cloids).size).toBe(3);
		expect(new Set(cloids.map((cloid) => cloid.slice(0, 30))).size).toBe(1);
	});

	it("sends nothing when the same plan is retried after its entry filled", async () => {
		typeSizeHere("2");
		exchange.placeOrder.mockRejectedValue(entryFilledTpRejected());
		info.orderStatus
			.mockResolvedValueOnce(lookup("filled"))
			.mockResolvedValueOnce(lookup("badTriggerPxRejected", true));
		await pressSubmit();
		await pressSubmit();
		expect(exchange.placeOrder).toHaveBeenCalledTimes(1);
		expect(info.orderStatus.mock.calls.map(([params]) => params.oid)).toEqual(sentCloids()[0]);
		expect(lastQueueUpdate()).toEqual({
			status: "failed",
			error: "Not sent again. Entry filled. Take profit rejected",
		});
	});

	it("sends a double-clicked market order once", async () => {
		form.orderType = "market";
		form.tpSlEnabled = false;
		typeSizeHere("4");
		exchange.placeOrder.mockResolvedValue(filledWith());
		const ticket = renderTicket();
		await Promise.all([ticket.buttonContent.action(), ticket.buttonContent.action()]);
		expect(exchange.placeOrder).toHaveBeenCalledTimes(1);
	});

	it("reports a timed-out order the exchange filled as filled", async () => {
		vi.useFakeTimers();
		form.orderType = "market";
		form.tpSlEnabled = false;
		typeSizeHere("5");
		exchange.placeOrder.mockRejectedValue(timedOut());
		info.orderStatus.mockResolvedValueOnce(UNKNOWN_OID).mockResolvedValue(lookup("filled"));
		await pressSubmitPastReconcile();
		expect(lastQueueUpdate()).toEqual({ status: "success", outcome: "filled" });
	});

	it("retries a timed-out plan the exchange never saw with the same cloids", async () => {
		vi.useFakeTimers();
		typeSizeHere("6");
		exchange.placeOrder.mockRejectedValueOnce(timedOut()).mockResolvedValueOnce(filledWith("waitingForTrigger"));
		info.orderStatus.mockResolvedValue(UNKNOWN_OID);
		await pressSubmitPastReconcile();
		expect(lastQueueUpdate()).toEqual({ status: "failed", error: "Request timed out after 10000 ms" });
		await pressSubmit();
		const [firstCloids, retryCloids] = sentCloids();
		expect(firstCloids[0]).toMatch(/^0x[0-9a-f]{32}$/);
		expect(retryCloids).toEqual(firstCloids);
		expect(lastQueueUpdate()).toEqual({ status: "success", outcome: "filled" });
	});

	it("gives an identical order new cloids once the first one filled", async () => {
		form.orderType = "market";
		form.tpSlEnabled = false;
		typeSizeHere("7");
		exchange.placeOrder.mockResolvedValue(filledWith());
		await pressSubmit();
		await pressSubmit();
		const [first, second] = sentCloids();
		expect(first[0]).toMatch(/^0x[0-9a-f]{32}$/);
		expect(second).not.toEqual(first);
	});

	it("never resends a timed-out order while the exchange cannot be reached to check it", async () => {
		vi.useFakeTimers();
		form.orderType = "market";
		form.tpSlEnabled = false;
		typeSizeHere("8");
		const offline = new HttpRequestError({ detail: "Failed to fetch" });
		exchange.placeOrder.mockRejectedValue(offline);
		info.orderStatus.mockRejectedValue(offline);
		await pressSubmitPastReconcile();
		expect(lastQueueUpdate()).toEqual({
			status: "failed",
			error: "Order status unknown: Failed to fetch. Check open orders before you try again.",
		});
		await pressSubmit();
		expect(exchange.placeOrder).toHaveBeenCalledTimes(1);
		expect(lastQueueUpdate()).toEqual({
			status: "failed",
			error: "Order status unknown. Check open orders before you try again.",
		});
	});
});
