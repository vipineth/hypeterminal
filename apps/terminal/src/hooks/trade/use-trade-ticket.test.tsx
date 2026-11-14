import Big from "big.js";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXPIRY_MARGIN_MS, EXPIRY_WINDOW_MS, type LockManagerLike } from "@/lib/trade/order-sender";
import {
	comesBackUp,
	createFakeExchange,
	createMemoryKeyValue,
	createMemoryLocks,
	type FakeExchange,
	goesDownOnFirstSend,
	type LegOutcome,
	type WireOrder,
} from "@/test/fake-exchange";

type UseTradeTicket = typeof import("@/hooks/trade/use-trade-ticket").useTradeTicket;
type SubmitPlanHook = ReturnType<typeof import("@/hooks/trade/use-submit-plan").useSubmitPlan>;
let useTradeTicket: UseTradeTicket;

const POINTS_USDC = vi.hoisted(() => ({
	kind: "spot",
	name: "@8",
	pairName: "POINTS/USDC",
	assetId: 10008,
	szDecimals: 0,
	markPx: "0.0026434",
	base: { name: "POINTS", displayName: "POINTS" },
	quote: { name: "USDC", displayName: "USDC" },
}));

const SOL_PERP = vi.hoisted(() => ({
	kind: "perp",
	name: "SOL",
	pairName: "SOL-USDC",
	assetId: 5,
	szDecimals: 2,
	markPx: "80.276",
	quote: { name: "USDC", displayName: "USDC" },
	dex: { name: "", index: 0, collateralToken: { name: "USDC", displayName: "USDC" } },
	crossAllowed: true,
}));

const form = vi.hoisted(() => ({
	market: POINTS_USDC as
		| typeof POINTS_USDC
		| (typeof SOL_PERP & { isDelisted?: boolean; deployerFeeScale?: number | null; growthMode?: boolean }),
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
	maxTradeSzs: ["100", "100"] as [string, string],
	availableToTrade: ["10000", "10000"] as [string, string],
	mainWithdrawable: "10000",
	quoteCoin: null as string | null,
	leverage: 10,
	slippagePercent: 2.5,
	takerRate: 0.0007,
}));

const liveFeed = vi.hoisted(() => ({ markPx: null as string | null, status: "active", isStale: false }));
const net = vi.hoisted(() => ({
	venue: null as unknown as FakeExchange,
	storage: null as unknown as ReturnType<typeof createMemoryKeyValue>,
	locks: null as unknown as LockManagerLike,
	address: "0x0000000000000000000000000000000000000001" as `0x${string}`,
}));
const formActions = vi.hoisted(() => ({ resetForm: vi.fn() }));
const queue = vi.hoisted(() => ({
	addOrder: vi.fn(() => "order-1"),
	updateOrder: vi.fn(),
	updateByRequestKey: vi.fn(),
	upsertByRequestKey: vi.fn(),
	removeOrder: vi.fn(),
}));

vi.mock("@/stores/use-order-queue-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-order-queue-store")>()),
	useOrderQueueActions: () => queue,
}));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: net.address, isConnected: true }),
	useWalletClient: () => ({ data: {}, isLoading: false, error: null }),
	useSwitchChain: () => ({ isPending: false, mutate: () => {} }),
}));

vi.mock("@hypeterminal/hl-react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@hypeterminal/hl-react")>()),
	useHyperliquidClients: () => ({ trading: net.venue.trading }),
}));

vi.mock("@/lib/trade/browser-env", () => ({
	getBrowserKeyValue: () => net.storage,
	getBrowserLocks: () => net.locks,
	getBrowserChangeBus: () => ({ post() {}, subscribe: () => () => {} }),
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => {
	const { DEFAULT_BUILDER_CONFIG } = await import("@/config/hyperliquid");
	function sendThroughSdk(method: string, params: Record<string, unknown>) {
		const trading = net.venue.trading as unknown as Record<string, (params: unknown) => Promise<unknown>>;
		return method === "order"
			? trading.order.call(net.venue.trading, { ...params, builder: DEFAULT_BUILDER_CONFIG })
			: trading[method].call(net.venue.trading, params);
	}
	return {
		...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
		useSelectedMarketInfo: () => ({ data: form.market }),
		useUserPositions: () => ({ getPosition: () => null }),
		useAgentStatus: () => ({ isReady: true, isLoading: false }),
		useAgentRegistration: () => ({ register: async () => {}, status: "ready" }),
		useHyperliquid: () => ({ builderConfig: DEFAULT_BUILDER_CONFIG, isTestnet: true }),
		useExchange: (method: string) => ({
			mutateAsync: (params: Record<string, unknown>) => sendThroughSdk(method, params),
			isPending: false,
		}),
		useSubscription: (method: string, params: { coin: string }) => ({
			data:
				method === "activeAssetCtx" && params.coin === form.market.name
					? { ctx: { markPx: liveFeed.markPx ?? form.market.markPx } }
					: undefined,
			status: liveFeed.status,
			isStale: liveFeed.isStale,
		}),
		getInfoClient: () => net.venue.info,
	};
});

vi.mock("@/hooks/trade/use-fee-rates", () => ({
	useFeeRates: () => ({ takerRate: form.takerRate, makerRate: 0.0004 }),
}));

vi.mock("@/stores/use-global-settings-store", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/stores/use-global-settings-store")>()),
	useMarketOrderSlippagePercent: () => form.slippagePercent,
	useMarketOrderSlippageBps: () => form.slippagePercent * 100,
}));

vi.mock("@/hooks/trade/use-account-balances", async () => {
	const { standardAccount } = await import("@/test/account-fixture");
	return {
		useAccountState: () =>
			standardAccount(
				[
					{ coin: "USDC", token: 0, total: form.quoteBalance },
					{ coin: "POINTS", token: 9, total: form.baseBalance },
				],
				form.mainWithdrawable,
				net.address,
			),
	};
});

vi.mock("@/hooks/trade/use-asset-leverage", async () => {
	const { liveQuote } = await import("@/test/account-fixture");
	return {
		useAssetLeverage: () => ({
			displayLeverage: form.leverage,
			currentLeverage: form.leverage,
			quote: liveQuote(form.quoteCoin ?? form.market.name, form.availableToTrade, form.maxTradeSzs, net.address),
		}),
	};
});

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

interface Props<T> {
	onTicket: (value: T) => void;
	render: () => T;
}

function typeSizeHere(size: string) {
	form.size = size;
	form.sizeUnit = { mode: form.sizeMode, assetId: form.market.assetId, szDecimals: form.market.szDecimals };
}

function TicketProbe<T>({ onTicket, render }: Props<T>) {
	onTicket(render());
	return null;
}

function renderTicket(render: UseTradeTicket = useTradeTicket): Ticket {
	const tickets: Ticket[] = [];
	renderToString(<TicketProbe render={render} onTicket={(ticket) => tickets.push(ticket)} />);
	return tickets[0];
}

async function pressSubmit() {
	const ticket = renderTicket();
	expect(ticket.buttonContent.disabled).toBe(false);
	await ticket.buttonContent.action();
}

async function loadTicket(): Promise<UseTradeTicket> {
	vi.resetModules();
	return (await import("@/hooks/trade/use-trade-ticket")).useTradeTicket;
}

function orderBodies() {
	return net.venue.orderRequests();
}

function twapBodies() {
	return net.venue.sentBodies().filter((body) => body.action.type === "twapOrder");
}

function sentOrders() {
	return orderBodies().map(({ action }) => (action.orders as WireOrder[]).map(withoutCloid));
}

function withoutCloid<T extends { c?: string }>({ c: _cloid, ...order }: T) {
	return order;
}

function sentCloids(): string[][] {
	return orderBodies().map(({ action }) => (action.orders as WireOrder[]).map((order) => order.c ?? ""));
}

function distinctOrderNonces(): number {
	return new Set(orderBodies().map((body) => body.nonce)).size;
}

function lastQueueUpdate() {
	return queue.updateOrder.mock.lastCall?.[1];
}

async function pressSubmitPastRetries() {
	const submitted = pressSubmit();
	await vi.advanceTimersByTimeAsync(12_000);
	await submitted;
}

beforeEach(() => {
	liveFeed.markPx = null;
	liveFeed.status = "active";
	liveFeed.isStale = false;
});

function wireNotional(orders: { p: string; s: string }[]): number {
	return orders.reduce((total, order) => total.plus(Big(order.s).times(order.p)), Big(0)).toNumber();
}

beforeEach(async () => {
	net.venue = createFakeExchange();
	net.storage = createMemoryKeyValue();
	net.locks = createMemoryLocks();
	net.address = "0x0000000000000000000000000000000000000001";
	queue.addOrder.mockClear();
	queue.updateOrder.mockClear();
	queue.updateByRequestKey.mockClear();
	queue.upsertByRequestKey.mockClear();
	useTradeTicket = await loadTicket();
});

afterEach(() => {
	vi.useRealTimers();
});

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
		form.maxTradeSzs = ["100", "100"];
		formActions.resetForm.mockReset();
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
		form.maxTradeSzs = ["100", "100"];
		form.availableToTrade = ["10000", "10000"];
		form.mainWithdrawable = "10000";
		form.quoteCoin = null;
	});

	it("checks margin and sends nothing while the only quote is for another market", async () => {
		form.quoteCoin = "xyz:NVDA";
		form.tpSlEnabled = false;
		const ticket = renderTicket();
		await ticket.buttonContent.action();

		expect(net.venue.orderRequests()).toHaveLength(0);
		expect(ticket.buttonContent).toMatchObject({ text: "Checking margin…", disabled: true });
		expect(ticket.validation.canSubmit).toBe(false);
	});

	it("names the empty builder dex and the USDC held elsewhere instead of offering Deposit", async () => {
		form.market = {
			...SOL_PERP,
			kind: "builderPerp",
			name: "xyz:NVDA",
			pairName: "NVDA-USDC",
			dex: { name: "xyz", index: 1, collateralToken: { name: "USDC", displayName: "USDC" } },
		};
		form.availableToTrade = ["0.0", "0.0"];
		form.maxTradeSzs = ["0.0", "0.0"];
		form.quoteBalance = "36.71";
		form.tpSlEnabled = false;
		const ticket = renderTicket();
		await ticket.buttonContent.action();

		expect(net.venue.orderRequests()).toHaveLength(0);
		expect(ticket.buttonContent.text).not.toBe("Deposit");
		expect(ticket.buttonContent.disabled).toBe(true);
		expect(ticket.entry.shortfall).toMatchObject({
			kind: "dexEmpty",
			dex: { name: "xyz" },
			elsewhere: [
				{ place: { kind: "perp" }, amount: "10000" },
				{ place: { kind: "spot" }, amount: "36.71" },
			],
		});
	});

	it("sends nothing for a market order typed on an empty builder dex", async () => {
		form.market = {
			...SOL_PERP,
			kind: "builderPerp",
			name: "xyz:NVDA",
			pairName: "NVDA-USDC",
			dex: { name: "xyz", index: 1, collateralToken: { name: "USDC", displayName: "USDC" } },
		};
		form.orderType = "market";
		form.availableToTrade = ["0.0", "0.0"];
		form.maxTradeSzs = ["0.0", "0.0"];
		form.tpSlEnabled = false;
		const ticket = renderTicket();
		await ticket.buttonContent.action();

		expect(net.venue.orderRequests()).toHaveLength(0);
		expect(ticket.buttonContent.disabled).toBe(true);
		expect(ticket.entry.shortfall?.kind).toBe("dexEmpty");
	});

	it("offers Deposit only when the collateral token is nowhere in the account", () => {
		form.availableToTrade = ["0.0", "0.0"];
		form.mainWithdrawable = "0.0";
		form.quoteBalance = "0";
		const ticket = renderTicket();

		expect(ticket.entry.shortfall?.kind).toBe("noFunds");
		expect(ticket.buttonContent).toMatchObject({ text: "Deposit", disabled: false });
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

	it("blocks entry on a delisted market with the reason and sends nothing", async () => {
		form.market = { ...SOL_PERP, isDelisted: true };
		form.tpSlEnabled = false;
		const ticket = renderTicket();
		await ticket.buttonContent.action();

		expect(ticket.validation.errors[0]).toBe("This market is delisted");
		expect(ticket.buttonContent.disabled).toBe(true);
		expect(net.venue.orderRequests()).toHaveLength(0);
	});

	it("sends nothing while the exchange gives no max size for the side", async () => {
		form.maxTradeSzs = ["0", "0"];
		form.tpSlEnabled = false;
		const ticket = renderTicket();
		await ticket.buttonContent.action();

		expect(net.venue.orderRequests()).toHaveLength(0);
		expect(ticket.validation.canSubmit).toBe(false);
	});

	it("names a builder perp's dex in the order toast", async () => {
		form.market = {
			...SOL_PERP,
			kind: "builderPerp",
			name: "io:NVDA",
			pairName: "NVDA-USDC",
			dex: { name: "io", index: 3, collateralToken: { name: "USDC", displayName: "USDC" } },
		};
		form.tpSlEnabled = false;
		await pressSubmit();

		expect(queue.addOrder).toHaveBeenLastCalledWith(expect.objectContaining({ market: "io:NVDA" }));
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

describe("top-up the ticket asks for on an empty builder dex", () => {
	const PARA_TOTAL2 = {
		...SOL_PERP,
		kind: "builderPerp",
		name: "para:TOTAL2",
		pairName: "TOTAL2-USDC",
		szDecimals: 3,
		dex: { name: "para", index: 7, collateralToken: { name: "USDC", displayName: "USDC" } },
		deployerFeeScale: 1,
		growthMode: false,
	};
	const TIER_ZERO_TAKER = 0.00045;
	const SCALE_ONE_TAKER_WITH_BUILDER = Big(TIER_ZERO_TAKER).times(2).plus(0.0001);

	function fundsToFill(
		side: "buy" | "sell",
		size: number,
		mark: string,
		fill: string,
		feeRate = SCALE_ONE_TAKER_WITH_BUILDER,
	) {
		const adverse = side === "buy" ? Big(fill).minus(mark) : Big(mark).minus(fill);
		const marginPrice = Big(fill).gt(mark) ? Big(fill) : Big(mark);
		return Big(size)
			.times(
				marginPrice
					.div(form.leverage)
					.plus(adverse.gt(0) ? adverse : 0)
					.plus(Big(fill).times(feeRate)),
			)
			.toNumber();
	}

	let before = { ...form };

	beforeEach(() => {
		before = { ...form };
		form.market = { ...PARA_TOTAL2, markPx: "100" };
		form.side = "sell";
		form.orderType = "market";
		form.sizeMode = "base";
		form.size = "100";
		form.sizeUnit = null;
		form.limitPrice = "";
		form.tpSlEnabled = false;
		form.reduceOnly = false;
		form.twapMinutes = 30;
		form.availableToTrade = ["0.0", "0.0"];
		form.maxTradeSzs = ["0.0", "0.0"];
		form.mainWithdrawable = "100000";
		form.quoteCoin = null;
		form.takerRate = TIER_ZERO_TAKER;
		form.leverage = 10;
		form.slippagePercent = 1;
	});

	afterEach(() => {
		Object.assign(form, before);
	});

	it("funds the doubled taker fee a deployer fee scale of 1 charges", () => {
		const ticket = renderTicket();

		expect(ticket.entry.shortfall?.kind).toBe("dexEmpty");
		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(fundsToFill("sell", 100, "100", "99"));
	});

	it("funds a fill at the tick the market order is sent on, below the raw slippage price", () => {
		form.market = { ...PARA_TOTAL2, markPx: "380.01" };
		form.slippagePercent = 3;
		const ticket = renderTicket();

		expect(fundsToFill("sell", 100, "380.01", "368.60")).toBe(4977.96);
		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(4977.96);
	});

	it("funds a twap at the 3% each suborder may slip, not the ticket's market slippage", () => {
		form.orderType = "twap";
		form.side = "buy";
		const ticket = renderTicket();

		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(fundsToFill("buy", 100, "100", "103"));
	});

	it("funds a limit buy through the book at the taker fee it pays", () => {
		form.orderType = "limit";
		form.side = "buy";
		form.limitPrice = "101";
		const ticket = renderTicket();

		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(fundsToFill("buy", 100, "100", "101"));
	});

	it("funds the growth-mode ceiling when a growth builder asset names no scale", () => {
		form.market = { ...PARA_TOTAL2, markPx: "100", deployerFeeScale: null, growthMode: true };
		const scaleJustUnderTen = Big(TIER_ZERO_TAKER).times(9.99).times(2).times(0.1).plus(0.0001);
		const ticket = renderTicket();

		expect(fundsToFill("sell", 100, "100", "99", scaleJustUnderTen)).toBe(1109.89109);
		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(1109.89109);
		expect(ticket.feeRatePercent).toBe("0.0900%");
	});

	it("funds at the tier-0 taker rate when the cached user rate is a lower tier", () => {
		form.takerRate = 0.0004;
		const ticket = renderTicket();

		expect(ticket.fundingNeed).toBeGreaterThanOrEqual(fundsToFill("sell", 100, "100", "99"));
		expect(ticket.feeRatePercent).toBe("0.0800%");
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
		form.maxTradeSzs = ["100", "100"];
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
		form.maxTradeSzs = ["100", "100"];
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
		form.maxTradeSzs = ["100", "100"];
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
		form.maxTradeSzs = ["1", "1"];
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
		form.maxTradeSzs = ["100", "100"];
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
		expect(orderBodies()[0].action.grouping).toBe("normalTpsl");
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
		expect(twapBodies()[0].action.twap).toMatchObject({ a: 10008, s: "100", r: false });
	});

	it("never sends a perp's hidden tp/sl on a spot limit", async () => {
		switchToSpot();
		form.reduceOnly = false;
		await pressSubmit();
		expect(orderBodies()[0].action).toMatchObject({
			orders: [{ a: 10008, b: true, p: "30", s: "100", r: false, t: { limit: { tif: "Gtc" } } }],
			grouping: "na",
		});
	});
});

function answerLegs(...answers: ((order: WireOrder) => LegOutcome)[]) {
	net.venue.state.legOutcome = (order, index) => answers[index]?.(order);
}

function filledLeg(order: WireOrder): LegOutcome {
	return { status: { filled: { totalSz: order.s, avgPx: order.p, oid: 11 } }, lookup: "filled" };
}

function restingLeg(): LegOutcome {
	return { status: { resting: { oid: 12 } }, lookup: "open" };
}

function rejectedLeg(reason: string) {
	return (): LegOutcome => ({ status: { error: reason }, lookup: "badTriggerPxRejected" });
}

describe("order legs the ticket reports and retries", () => {
	const TP_REASON = "Invalid TP/SL price. asset=5";

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
		form.maxTradeSzs = ["100", "100"];
	});

	function marketOrder(size: string) {
		form.orderType = "market";
		form.tpSlEnabled = false;
		typeSizeHere(size);
	}

	it("reports an entry that fills with a rejected take profit per leg", async () => {
		typeSizeHere("1");
		answerLegs(filledLeg, rejectedLeg(TP_REASON));
		await pressSubmit();
		expect(lastQueueUpdate()).toEqual({ status: "failed", error: `Entry filled. Take profit rejected: ${TP_REASON}` });
	});

	it("gives every leg its own cloid from one plan id", async () => {
		typeSizeHere("3");
		form.slPrice = "70";
		await pressSubmit();
		const [cloids] = sentCloids();
		expect(cloids).toHaveLength(3);
		for (const cloid of cloids) expect(cloid).toMatch(/^0x[0-9a-f]{32}$/);
		expect(new Set(cloids).size).toBe(3);
		expect(new Set(cloids.map((cloid) => cloid.slice(0, 30))).size).toBe(1);
	});

	it("signs the builder fee into the order", async () => {
		marketOrder("1");
		await pressSubmit();
		expect(orderBodies()[0].action.builder).toEqual({ b: "0x744e2f0b69456b42278b3e797a58ff57e5180a7e", f: 10 });
	});

	it("sends a double-clicked market order once while the exchange answers every read", async () => {
		marketOrder("4");
		const ticket = renderTicket();
		await Promise.all([ticket.buttonContent.action(), ticket.buttonContent.action()]);
		expect(net.venue.state.placedLegs).toBe(1);
		expect(net.venue.exchangeRequests).toHaveLength(1);
	});

	it("keeps submit disabled while an order is being sent", async () => {
		vi.useFakeTimers();
		marketOrder("4");
		net.venue.nextExchangeRequests("lost");
		const submitted = pressSubmit();
		await vi.advanceTimersByTimeAsync(10);
		expect(renderTicket().buttonContent.disabled).toBe(true);
		await vi.advanceTimersByTimeAsync(12_000);
		await submitted;
		expect(renderTicket().buttonContent.disabled).toBe(false);
	});

	it("reports a timed-out order the exchange filled as filled", async () => {
		vi.useFakeTimers();
		marketOrder("5");
		net.venue.nextExchangeRequests("noReply");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({ status: "success", outcome: "filled" });
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("places a timed-out order the exchange never saw exactly once", async () => {
		vi.useFakeTimers();
		marketOrder("6");
		net.venue.nextExchangeRequests("lost");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({ status: "success", outcome: "filled" });
		expect(net.venue.state.placedLegs).toBe(1);
		expect(distinctOrderNonces()).toBe(1);
	});

	it("expires each order 30 s past the exchange clock", async () => {
		marketOrder("1");
		await pressSubmit();
		const [body] = orderBodies();
		expect(body.expiresAfter).toBeGreaterThan(net.venue.exchangeNow() + 29_000);
		expect(body.expiresAfter).toBeLessThanOrEqual(net.venue.exchangeNow() + 30_000);
	});

	it("gives an identical order new cloids once the first one filled", async () => {
		marketOrder("7");
		await pressSubmit();
		await pressSubmit();
		const [first, second] = sentCloids();
		expect(first[0]).toMatch(/^0x[0-9a-f]{32}$/);
		expect(second).not.toEqual(first);
		expect(net.venue.state.placedLegs).toBe(2);
	});

	it("places one order when an unconfirmed order is pressed again after the exchange comes back", async () => {
		vi.useFakeTimers();
		marketOrder("8");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		await pressSubmitPastRetries();
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("shows the earlier unconfirmed order as filled when a press after its expiry finds it filled", async () => {
		vi.useFakeTimers();
		marketOrder("8");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		const unconfirmed = lastQueueUpdate();
		comesBackUp(net.venue);
		await vi.advanceTimersByTimeAsync(EXPIRY_WINDOW_MS + EXPIRY_MARGIN_MS);
		await pressSubmitPastRetries();
		expect(unconfirmed).toMatchObject({ status: "unsettled", requestKey: expect.stringMatching(/#\d+$/) });
		expect(queue.upsertByRequestKey).toHaveBeenCalledWith(
			unconfirmed.requestKey,
			expect.anything(),
			expect.objectContaining({ status: "success", outcome: "filled" }),
		);
	});

	it("places one order when an unconfirmed order is pressed again after a reload", async () => {
		vi.useFakeTimers();
		marketOrder("9");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		useTradeTicket = await loadTicket();
		await pressSubmitPastRetries();
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("places one order when a timed-out original arrives after the order is pressed again", async () => {
		vi.useFakeTimers();
		marketOrder("10");
		net.venue.nextExchangeRequests("inTransit");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		await pressSubmitPastRetries();
		net.venue.deliverInTransit();
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("places one order when a USDC-sized order is typed again after the mark moved", async () => {
		vi.useFakeTimers();
		form.sizeMode = "quote";
		marketOrder("800");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		form.market = { ...SOL_PERP, markPx: "81.5" };
		typeSizeHere("800");
		await pressSubmitPastRetries();
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("places one order when two tabs press the same order at once", async () => {
		marketOrder("11");
		const secondTab = await loadTicket();
		await Promise.all([renderTicket().buttonContent.action(), renderTicket(secondTab).buttonContent.action()]);
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("leaves no unconfirmed row behind for another tab's order that is still being sent", async () => {
		marketOrder("11");
		let releaseReply = () => {};
		const replyHeld = new Promise<void>((resolve) => {
			releaseReply = resolve;
		});
		net.venue.state.onReply = async () => {
			net.venue.state.onReply = null;
			await replyHeld;
		};
		const firstTab = renderTicket().buttonContent.action();
		await vi.waitFor(() => expect(net.venue.exchangeRequests).toHaveLength(1));
		useTradeTicket = await loadTicket();
		await pressSubmit();
		const secondTabRow = lastQueueUpdate();
		releaseReply();
		await firstTab;
		expect(queue.upsertByRequestKey).not.toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({ status: "unsettled" }),
		);
		expect(secondTabRow).toMatchObject({ status: "notSent" });
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("gives a press blocked by an unconfirmed order its own not-sent row and keeps the ticket", async () => {
		vi.useFakeTimers();
		marketOrder("1");
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await pressSubmitPastRetries();
		const buyRow = lastQueueUpdate();
		expect(buyRow).toMatchObject({ status: "unsettled", requestKey: expect.stringMatching(/#\d+$/) });
		formActions.resetForm.mockClear();
		form.side = "sell";
		typeSizeHere("5");
		net.venue.nextExchangeRequests("lost");
		await pressSubmitPastRetries();
		const sellRow = lastQueueUpdate();
		expect(sellRow).toMatchObject({
			status: "notSent",
			error: expect.stringMatching(
				/^Not sent\. An earlier order on this market is not confirmed yet\. It can still execute until .+\. Retry on that order's row sends it again\. To send this one, cancel that order and press again\.$/,
			),
		});
		expect(sellRow.requestKey).toBeUndefined();
		expect(formActions.resetForm).not.toHaveBeenCalled();
		expect(queue.upsertByRequestKey).not.toHaveBeenCalled();
		expect(
			sentOrders()
				.flat()
				.filter((order) => order.b === false),
		).toEqual([]);
	});

	it("holds a corrected scale resubmit and keeps the ticket, so the filled leg is placed once", async () => {
		form.orderType = "scale";
		form.tpSlEnabled = false;
		form.scaleStart = "82";
		form.scaleEnd = "79";
		form.scaleLevels = 2;
		typeSizeHere("2");
		answerLegs(filledLeg, rejectedLeg("Order price cannot be more than 80% away from the reference price"));
		formActions.resetForm.mockClear();
		await pressSubmit();
		expect(lastQueueUpdate()).toMatchObject({ status: "failed" });
		expect(formActions.resetForm).not.toHaveBeenCalled();
		net.venue.state.legOutcome = null;
		form.scaleEnd = "80";
		await pressSubmit();
		const held = lastQueueUpdate();
		expect(held).toMatchObject({
			status: "notSent",
			error: expect.stringMatching(
				/^Not sent\. Your last order on this market: Leg 1 at \S+ placed, Leg 2 at \S+ rejected\. /,
			),
		});
		expect(orderBodies()).toHaveLength(1);
		expect(formActions.resetForm).not.toHaveBeenCalled();
		expect(net.venue.state.placedLegs).toBe(1);
	});

	it("reports a scale order with filled and resting legs as partly filled", async () => {
		form.orderType = "scale";
		form.tpSlEnabled = false;
		form.scaleStart = "82";
		form.scaleEnd = "79";
		form.scaleLevels = 2;
		typeSizeHere("2");
		answerLegs(filledLeg, restingLeg);
		await pressSubmit();
		expect(lastQueueUpdate()).toEqual({
			status: "success",
			outcome: "partiallyFilled",
			detail: "1 of 2 legs filled, 1 placed",
		});
	});
});

describe("the order a fresh press signs", () => {
	const AWAY_REASON = "Order price cannot be more than 80% away from the reference price";

	beforeEach(() => {
		form.market = SOL_PERP;
		form.side = "buy";
		form.orderType = "market";
		form.sizeMode = "base";
		form.triggerPrice = "";
		form.reduceOnly = false;
		form.twapMinutes = null;
		form.tpSlEnabled = true;
		form.tpPrice = "500";
		form.slPrice = "";
		form.sizeUnit = null;
		form.maxTradeSzs = ["100", "100"];
		typeSizeHere("1");
	});

	function takeProfitsIn(bodies: ReturnType<typeof orderBodies>): string[] {
		return bodies.flatMap(({ action }) =>
			(action.orders as WireOrder[]).flatMap(({ t }) =>
				"trigger" in t && t.trigger.tpsl === "tp" ? [t.trigger.triggerPx] : [],
			),
		);
	}

	async function pressRowAction(act: (hook: SubmitPlanHook) => Promise<unknown>) {
		const { useSubmitPlan } = await import("@/hooks/trade/use-submit-plan");
		const hooks: SubmitPlanHook[] = [];
		renderToString(<TicketProbe render={useSubmitPlan} onTicket={(hook) => hooks.push(hook)} />);
		const acted = act(hooks[0]);
		await vi.advanceTimersByTimeAsync(12_000);
		await acted;
	}

	it("sends no take profit once the field is cleared after the exchange rejected the order", async () => {
		answerLegs(rejectedLeg(AWAY_REASON), rejectedLeg(AWAY_REASON));
		await pressSubmit();
		expect(lastQueueUpdate()).toMatchObject({ status: "failed", error: AWAY_REASON });
		net.venue.state.legOutcome = null;
		form.tpPrice = "";
		form.slPrice = "70";
		await pressSubmit();
		const [rejected, cleared] = orderBodies();
		expect(takeProfitsIn([rejected])).toEqual(["500"]);
		expect(takeProfitsIn([cleared])).toEqual([]);
		expect(net.venue.state.placedLegs).toBe(2);
	});

	it.each([
		["its reply was lost", () => net.venue.nextExchangeRequests("lost", "lost", "lost", "lost")],
		[
			"the exchange refused the whole request",
			() => {
				net.venue.state.rejectWith = "Temporary pre-nonce rejection";
			},
		],
	])(
		"never sends an unconfirmed order's take profit from a press after the field is cleared, when %s",
		async (_case, failFirstPress) => {
			vi.useFakeTimers();
			failFirstPress();
			await pressSubmitPastRetries();
			expect(lastQueueUpdate()).toMatchObject({ status: "unsettled" });
			net.venue.state.rejectWith = null;
			form.tpPrice = "";
			form.slPrice = "70";
			const sentBefore = orderBodies().length;
			await pressSubmitPastRetries();
			expect(takeProfitsIn(orderBodies().slice(sentBefore))).toEqual([]);
			expect(net.venue.state.placedLegs).toBe(0);
			expect(orderBodies()).toHaveLength(sentBefore);
			expect(lastQueueUpdate()).toMatchObject({
				status: "notSent",
				error: expect.stringContaining("Retry on that order's row sends it again."),
			});
		},
	);

	it("resends the earlier order exactly as signed only from its Retry", async () => {
		vi.useFakeTimers();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await pressSubmitPastRetries();
		const { requestKey } = lastQueueUpdate();
		const [signed] = orderBodies();
		form.tpPrice = "";
		form.slPrice = "70";
		await pressSubmitPastRetries();
		expect(net.venue.state.placedLegs).toBe(0);
		await pressRowAction((hook) => hook.retryRequest(requestKey));
		expect(orderBodies().at(-1)).toEqual(signed);
		expect(takeProfitsIn(orderBodies())).toEqual(["500", "500", "500", "500", "500"]);
		expect(net.venue.state.placedLegs).toBe(2);
	});

	it("shows the earlier unconfirmed order as expired once a press past its expiry places the edited ticket", async () => {
		vi.useFakeTimers();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await pressSubmitPastRetries();
		const unconfirmed = lastQueueUpdate();
		expect(unconfirmed).toMatchObject({ status: "unsettled", requestKey: expect.stringMatching(/#\d+$/) });
		await vi.advanceTimersByTimeAsync(EXPIRY_WINDOW_MS + EXPIRY_MARGIN_MS + 1000);
		form.tpPrice = "";
		form.slPrice = "70";
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toMatchObject({ status: "success" });
		expect(queue.upsertByRequestKey).toHaveBeenCalledWith(
			unconfirmed.requestKey,
			expect.anything(),
			expect.objectContaining({
				status: "failed",
				error: "Not placed. The request expired before the exchange took it.",
			}),
		);
		expect(queue.upsertByRequestKey).not.toHaveBeenCalledWith(
			unconfirmed.requestKey,
			expect.anything(),
			expect.objectContaining({ status: "unsettled" }),
		);
		expect(net.venue.state.placedLegs).toBe(2);
	});

	it("shows an unconfirmed order as expired when its Dismiss finds it past expiry", async () => {
		vi.useFakeTimers();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await pressSubmitPastRetries();
		const { requestKey } = lastQueueUpdate();
		await vi.advanceTimersByTimeAsync(EXPIRY_WINDOW_MS + EXPIRY_MARGIN_MS + 1000);
		const previews: unknown[] = [];
		await pressRowAction(async (hook) => previews.push(await hook.previewDismiss(requestKey)));
		expect(previews).toEqual([
			{
				kind: "result",
				result: { ok: false, status: "failed", error: "Not placed. The request expired before the exchange took it." },
			},
		]);
		expect(net.venue.state.placedLegs).toBe(0);
	});

	it("signs the edited ticket once the earlier unconfirmed order is canceled", async () => {
		vi.useFakeTimers();
		net.venue.nextExchangeRequests("lost", "lost", "lost", "lost");
		await pressSubmitPastRetries();
		const { requestKey } = lastQueueUpdate();
		form.tpPrice = "";
		form.slPrice = "70";
		await pressRowAction((hook) => hook.cancelRequest(requestKey));
		await pressSubmitPastRetries();
		const edited = orderBodies().at(-1);
		expect(edited && takeProfitsIn([edited])).toEqual([]);
		expect(net.venue.state.placedLegs).toBe(2);
	});
});

describe("twap the ticket sends once", () => {
	const SAME_PARAMS = {
		side: "B",
		minutes: 30,
		reduceOnly: false,
		randomize: false,
		executedSz: "0.0",
		executedNtl: "0.0",
	};

	beforeEach(() => {
		form.market = SOL_PERP;
		form.side = "buy";
		form.orderType = "twap";
		form.sizeMode = "base";
		form.limitPrice = "80.276";
		form.reduceOnly = false;
		form.twapMinutes = 30;
		form.tpSlEnabled = false;
		form.sizeUnit = null;
		form.maxTradeSzs = ["100", "100"];
	});

	it("sends a double-clicked twap once while the exchange answers every read", async () => {
		typeSizeHere("4");
		const ticket = renderTicket();
		await Promise.all([ticket.buttonContent.action(), ticket.buttonContent.action()]);
		expect(net.venue.state.startedTwaps).toBe(1);
		expect(twapBodies()).toHaveLength(1);
		expect(twapBodies()[0].action.twap).toMatchObject({ a: 5, b: true, s: "4", m: 30 });
	});

	it("calls a timed-out twap that history matches unknown, since history cannot say whose it is", async () => {
		vi.useFakeTimers();
		typeSizeHere("5");
		net.venue.nextExchangeRequests("noReply");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({
			status: "unknown",
			error:
				"TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.",
		});
		expect(net.venue.state.startedTwaps).toBe(1);
	});

	it("still finds a timed-out twap in history when the device clock runs 6 minutes ahead", async () => {
		vi.useFakeTimers();
		net.venue.state.clockSkewMs = -6 * 60 * 1000;
		useTradeTicket = await loadTicket();
		typeSizeHere("5");
		net.venue.nextExchangeRequests("noReply");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({
			status: "unknown",
			error:
				"TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.",
		});
	});

	it("never reports a twap from another coin or an earlier press as this one", async () => {
		vi.useFakeTimers();
		typeSizeHere("6");
		net.venue.seedTwap({
			time: 0,
			state: { coin: "ETH", sz: "6", ...SAME_PARAMS, timestamp: Date.now() },
			status: { status: "activated" },
			twapId: 1,
		});
		net.venue.seedTwap({
			time: 0,
			state: { coin: "SOL", sz: "6", ...SAME_PARAMS, timestamp: Date.now() - 4 * 60 * 1000 },
			status: { status: "terminated" },
			twapId: 2,
		});
		net.venue.state.exchangeDown = true;
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toMatchObject({ status: "unsettled", requestKey: expect.stringMatching(/#\d+$/) });
		expect(net.venue.state.startedTwaps).toBe(0);
	});

	it("never reports a matching history record's error as this twap's outcome", async () => {
		vi.useFakeTimers();
		typeSizeHere("7");
		net.venue.state.twapStatus = { status: "error", description: "Insufficient margin" };
		net.venue.nextExchangeRequests("noReply");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({
			status: "unknown",
			error:
				"TWAP status unknown. A matching TWAP appeared in your history, but it can't be confirmed as this one. It will not be sent again. Check the TWAP tab.",
		});
	});

	it("starts a timed-out twap the exchange never saw exactly once", async () => {
		vi.useFakeTimers();
		typeSizeHere("8");
		net.venue.nextExchangeRequests("lost");
		await pressSubmitPastRetries();
		expect(lastQueueUpdate()).toEqual({ status: "success", outcome: "twapStarted" });
		expect(net.venue.state.startedTwaps).toBe(1);
	});

	it("starts one twap when an unconfirmed twap is pressed again after the exchange comes back", async () => {
		vi.useFakeTimers();
		typeSizeHere("9");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		await pressSubmitPastRetries();
		expect(net.venue.state.startedTwaps).toBe(1);
	});

	it("starts one twap when an unconfirmed twap is pressed again after a reload", async () => {
		vi.useFakeTimers();
		typeSizeHere("9");
		goesDownOnFirstSend(net.venue);
		await pressSubmitPastRetries();
		comesBackUp(net.venue);
		useTradeTicket = await loadTicket();
		await pressSubmitPastRetries();
		expect(net.venue.state.startedTwaps).toBe(1);
	});
});
