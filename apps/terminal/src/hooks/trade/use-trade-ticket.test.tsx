import Big from "big.js";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const form = vi.hoisted(() => ({
	side: "buy",
	orderType: "limit",
	sizeMode: "base",
	quoteBalance: "1000",
	baseBalance: "0",
	size: "10000",
	limitPrice: "0.0026434",
	scaleStart: "",
	scaleEnd: "",
	scaleLevels: 5,
}));

const exchange = vi.hoisted(() => ({ placeOrder: vi.fn() }));
const formActions = vi.hoisted(() => ({ resetForm: vi.fn() }));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: "0x0000000000000000000000000000000000000001", isConnected: true }),
	useWalletClient: () => ({ data: {}, isLoading: false, error: null }),
	useSwitchChain: () => ({ isPending: false, mutate: () => {} }),
}));

vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useSelectedMarketInfo: () => ({ data: POINTS_USDC }),
	useUserPositions: () => ({ getPosition: () => null }),
	useAgentStatus: () => ({ isReady: true, isLoading: false }),
	useAgentRegistration: () => ({ register: async () => {}, status: "ready" }),
	useExchange: () => ({ mutateAsync: exchange.placeOrder, isPending: false }),
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
	useAssetLeverage: () => ({ maxTradeSzs: null, availableToTrade: null }),
}));

vi.mock("@/stores/use-order-entry-store", () => ({
	useOrderSide: () => form.side,
	useOrderType: () => form.orderType,
	useSizeMode: () => form.sizeMode,
	useReduceOnly: () => false,
	useOrderSize: () => form.size,
	useLimitPrice: () => form.limitPrice,
	useTriggerPrice: () => "",
	useScaleStart: () => form.scaleStart,
	useScaleEnd: () => form.scaleEnd,
	useScaleLevels: () => form.scaleLevels,
	useTwapMinutes: () => null,
	useTwapRandomize: () => false,
	useTpSlEnabled: () => false,
	useTpPrice: () => "",
	useSlPrice: () => "",
	useTif: () => "Gtc",
	useOrderEntryActions: () => ({
		resetForm: formActions.resetForm,
		setOrderType: () => {},
		setSizeMode: () => {},
		setSize: () => {},
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

async function pressSubmit() {
	const tickets: Ticket[] = [];
	renderToString(<TicketProbe onTicket={(ticket) => tickets.push(ticket)} />);
	const [ticket] = tickets;
	expect(ticket.buttonContent.disabled).toBe(false);
	await ticket.buttonContent.action();
}

function sentOrders() {
	return exchange.placeOrder.mock.calls.map(([action]) => action.orders);
}

function wireNotional(orders: { p: string; s: string }[]): number {
	return orders.reduce((total, order) => total.plus(Big(order.s).times(order.p)), Big(0)).toNumber();
}

describe("spot trade ticket", () => {
	beforeEach(() => {
		form.side = "buy";
		form.orderType = "limit";
		form.sizeMode = "base";
		form.quoteBalance = "1000";
		form.baseBalance = "0";
		form.size = "10000";
		form.limitPrice = "0.0026434";
		form.scaleStart = "";
		form.scaleEnd = "";
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
