import type { OrderPlan } from "@/domain/trade/order-intent";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderScenarios } from "./scenarios/orders";

const bug = vi.hoisted(() => ({ current: "" }));

vi.mock("@/domain/trade/order-intent", async (importOriginal) => {
	const app = await importOriginal<typeof import("@/domain/trade/order-intent")>();
	return {
		...app,
		buildOrderPlan: (intent: Parameters<typeof app.buildOrderPlan>[0]): OrderPlan => {
			const built = app.buildOrderPlan(intent);
			for (const order of built.orders) {
				if (!("limit" in order.t)) continue;
				if (bug.current === "Gtc") order.t.limit.tif = "Gtc";
				if (bug.current === "Ioc with a 50% cap") {
					order.t.limit.tif = "Ioc";
					order.p = "0.15";
				}
			}
			return built;
		},
	};
});

vi.mock("@/domain/trade/twap", async (importOriginal) => {
	const app = await importOriginal<typeof import("@/domain/trade/twap")>();
	return {
		...app,
		buildTwapPlan: (intent: Parameters<typeof app.buildTwapPlan>[0]) =>
			app.buildTwapPlan({ ...intent, randomize: bug.current === "randomize" ? true : intent.randomize }),
	};
});

interface WireOrder {
	b: boolean;
	p: string;
	s: string;
}

interface WireTwap {
	b: boolean;
	s: string;
	m: number;
	r: boolean;
	t: boolean;
}

const meta = { universe: [{ name: "DOGE", szDecimals: 0 }], collateralToken: 0 };
let position = 0;
let history: object[] = [];

const h = {
	user: "0x00000000000000000000000000000000000000aa",
	info: {
		metaAndAssetCtxs: async () => [meta, [{ markPx: "0.1" }]],
		clearinghouseState: async () => ({ assetPositions: position ? [{ position: { coin: "DOGE", szi: String(position) } }] : [] }),
		perpDexs: async () => [null],
		allPerpMetas: async () => [meta],
		spotMeta: async () => ({
			tokens: [{ name: "USDC", index: 0, szDecimals: 8, weiDecimals: 8, tokenId: "0x6d1e7cde53ba9467b783cb7c530ce054" }],
			universe: [],
		}),
		twapHistory: async () => history,
	},
	agent: {
		order: async ({ orders }: { orders: WireOrder[] }) => ({
			response: {
				data: {
					statuses: orders.map((order) => {
						position += Number(order.s);
						return { filled: { totalSz: order.s, avgPx: "0.1", oid: 1 } };
					}),
				},
			},
		}),
		twapOrder: async ({ twap }: { twap: WireTwap }) => {
			history = [
				{
					time: 1,
					twapId: 1,
					status: { status: "activated" },
					state: { coin: "DOGE", side: twap.b ? "B" : "A", sz: twap.s, minutes: twap.m, reduceOnly: twap.r, randomize: twap.t },
				},
			];
			return { response: { data: { status: { running: { twapId: 1 } } } } };
		},
		twapCancel: async () => {
			history = history.map((entry) => ({ ...entry, time: 2, status: { status: "terminated" } }));
		},
	},
};

function run(name: string) {
	const scenario = orderScenarios.find((entry) => entry.name === name);
	if (!scenario) throw new Error(`no ${name} scenario`);
	return scenario.run({ h: h as never, venue: { label: "main", dex: "", coin: "DOGE" } as never });
}

beforeEach(() => {
	bug.current = "";
	position = 0;
	history = [];
});

describe("market intent", () => {
	it("passes the app's own market order", async () => {
		await run("market");
		expect(position).toBeGreaterThan(0);
	});

	it.each(["Gtc", "Ioc with a 50% cap"])("fails a market order sent as %s", async (planted) => {
		bug.current = planted;
		await expect(run("market")).rejects.toThrow(/not FrontendMarket/);
	});

	it("fails a market order whose cap is 50% off mark, whatever its tif", async () => {
		bug.current = "Ioc with a 50% cap";
		await expect(run("market")).rejects.toThrow(/buy cap 0.15 is not mark 0.1 \+ 250 bps/);
	});
});

describe("twap intent", () => {
	it("passes the app's own twap", async () => {
		await run("twap");
	});

	it("fails a twap that randomizes when the intent did not", async () => {
		bug.current = "randomize";
		await expect(run("twap")).rejects.toThrow(/"randomize":true/);
	});
});
