import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MarketOverview } from "@/components/trade/market-overview";
import { MobileHistoryTab } from "@/components/trade/mobile/mobile-history-tab";
import { MobileOrdersHistoryTab } from "@/components/trade/mobile/mobile-orders-history-tab";
import { TradesPanel } from "@/components/trade/orderbook/trades-panel";
import { HistoryTab } from "@/components/trade/positions/history-tab";
import { OrdersHistoryTab } from "@/components/trade/positions/orders-history-tab";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";

const snapshot: MetaPayloads & { spotMarkPxs: string[] } = JSON.parse(
	readFileSync(new URL("../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);
const bid = model.byName.get("@33");
if (bid?.kind !== "spot" || bid.base.name !== "BID") throw new Error("fixture lost BID at @33");
const BID_PX = snapshot.spotMarkPxs[bid.ctxIndex];

const feeds = vi.hoisted(() => ({ data: {} as Record<string, unknown>, selected: undefined as unknown }));

vi.mock("wagmi", () => ({
	useConnection: () => ({ address: "0x0000000000000000000000000000000000000001", isConnected: true }),
}));
vi.mock("@/providers/exchange-scope", () => ({ useExchangeScope: () => ({ scope: "all" }) }));
vi.mock("@/stores/use-market-store", () => ({ useMarketActions: () => ({ setSelectedMarket() {} }) }));
vi.mock("@/components/trade/components/asset-display", () => ({ AssetDisplay: () => null }));
vi.mock("@/lib/hyperliquid", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/hyperliquid")>()),
	useMarkets: () => ({ getMarket: (coin: string) => model.byName.get(coin) }),
	useSelectedMarketInfo: () => ({ data: feeds.selected }),
	useSubscription: (method: string) => ({ status: "active", data: feeds.data[method], error: null }),
}));

const buyFill = {
	coin: "@33",
	side: "B",
	dir: "Buy",
	px: BID_PX,
	sz: "100000000",
	fee: "0",
	feeToken: "USDC",
	closedPnl: "0",
	time: 1_700_000_000_000,
	hash: "0xabc",
	tid: 1,
	liquidation: null,
};

feeds.selected = { ...bid, markPx: BID_PX, prevDayPx: BID_PX };
feeds.data = {
	trades: [{ coin: "@33", side: "B", px: BID_PX, sz: "100000000", time: 1_700_000_000_000, hash: "0xabc", tid: 1 }],
	userFills: { fills: [buyFill] },
	userHistoricalOrders: {
		orderHistory: [
			{
				order: {
					coin: "@33",
					side: "B",
					limitPx: BID_PX,
					origSz: "100000000",
					orderType: "Limit",
					timestamp: 1,
					oid: 1,
				},
				status: "filled",
				statusTimestamp: 1,
			},
		],
	},
};

const surfaces: [string, () => ReactElement][] = [
	["market overview", () => <MarketOverview />],
	["recent trades", () => <TradesPanel />],
	["desktop trade history", () => <HistoryTab />],
	["mobile trade history", () => <MobileHistoryTab />],
	["desktop order history", () => <OrdersHistoryTab />],
	["mobile order history", () => <MobileOrdersHistoryTab />],
];

describe("spot prices below a cent", () => {
	it.each(surfaces)("%s shows BID at its full price", (_, render) => {
		expect(BID_PX).toBe("0.00000032");
		expect(renderToString(render())).toContain("0.00000032");
	});
});

describe("mobile trade history", () => {
	it("marks a spot buy fill as a buy", () => {
		const html = renderToString(<MobileHistoryTab />);

		expect(html).toContain("bg-success");
		expect(html).not.toContain("bg-error");
		expect(html).not.toContain("text-error");
	});
});
