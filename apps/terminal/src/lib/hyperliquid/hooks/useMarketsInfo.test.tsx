import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { type UseMarketsInfoReturn, useMarketsInfoInternal } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { MarketsProvider, type Markets, useMarkets } from "@/lib/hyperliquid/markets/use-markets";

const snapshot = vi.hoisted(
	(): MetaPayloads => ({ perpDexs: [], allPerpMetas: [], spotMeta: { tokens: [], universe: [] } }),
);
const pending = vi.hoisted(() => new Set<string>());

vi.mock("@hypeterminal/hl-react", () => ({
	useInfo: (method: string) => ({
		data: method in snapshot && !pending.has(method) ? snapshot[method as keyof MetaPayloads] : undefined,
		isLoading: pending.has(method),
		error: null,
	}),
	useSubscription: () => ({ data: undefined }),
}));

Object.assign(
	snapshot,
	JSON.parse(readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8")),
);

let rendered: { info?: UseMarketsInfoReturn; markets?: Markets } = {};

function Probe() {
	rendered.info = useMarketsInfoInternal();
	rendered.markets = useMarkets();
	return null;
}

function renderMarketsInfo(): UseMarketsInfoReturn {
	return renderProviders().info;
}

function renderProviders() {
	rendered = {};
	renderToString(
		<MarketsProvider>
			<Probe />
		</MarketsProvider>,
	);
	const { info, markets } = rendered;
	if (!info || !markets) throw new Error("the markets providers did not render");
	return { info, markets };
}

describe("useMarketsInfo", () => {
	const delisted = parseMarkets(snapshot).markets.find((market) => market.isDelisted && market.kind === "perp");

	it("resolves a delisted deep link to its own market so the page can mark it delisted", () => {
		if (!delisted) throw new Error("fixture has no delisted main perp");
		const info = renderMarketsInfo();

		expect(info.markets.some((market) => market.name === delisted.name)).toBe(false);
		expect(info.getMarketInfo(delisted.name)).toMatchObject({
			name: delisted.name,
			assetId: delisted.assetId,
			isDelisted: true,
		});
	});

	it("still resolves a listed market and nothing for an unknown coin", () => {
		const info = renderMarketsInfo();

		expect(info.getMarketInfo("BTC")).toMatchObject({ name: "BTC", assetId: 0, isDelisted: false });
		expect(info.getMarketInfo("NOT-A-COIN")).toBeUndefined();
	});

	it("serves perps before spotMeta lands and no spot market until it parses", () => {
		pending.add("spotMeta");
		const before = renderProviders();
		pending.delete("spotMeta");

		expect(before.info.getMarketInfo("BTC")).toMatchObject({ name: "BTC", assetId: 0, pairName: "BTC-USDC" });
		expect(before.markets.getMarket("io:NVDA")).toMatchObject({ name: "io:NVDA", assetId: 200014 });
		expect(before.info.getMarketInfo("@107")).toBeUndefined();
		expect(before.markets.getMarket("@107")).toBeUndefined();
		expect(before.info.spotMarkets).toEqual([]);

		const after = renderProviders();
		expect(after.info.getMarketInfo("@107")).toMatchObject({ kind: "spot", assetId: 10107 });
		expect(after.markets.getMarket("@107")).toMatchObject({ kind: "spot", assetId: 10107 });
	});
});
