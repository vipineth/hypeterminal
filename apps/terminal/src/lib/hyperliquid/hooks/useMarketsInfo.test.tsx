import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { type UseMarketsInfoReturn, useMarketsInfoInternal } from "@/lib/hyperliquid/hooks/useMarketsInfo";
import { MarketsProvider } from "@/lib/hyperliquid/markets/use-markets";

const snapshot = vi.hoisted(
	(): MetaPayloads => ({ perpDexs: [], allPerpMetas: [], spotMeta: { tokens: [], universe: [] } }),
);

vi.mock("@hypeterminal/hl-react", () => ({
	useInfo: (method: string) => ({
		data: method in snapshot ? snapshot[method as keyof MetaPayloads] : undefined,
		isLoading: false,
		error: null,
	}),
	useSubscription: () => ({ data: undefined }),
}));

Object.assign(
	snapshot,
	JSON.parse(readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8")),
);

const rendered: { info?: UseMarketsInfoReturn } = {};

function Probe() {
	rendered.info = useMarketsInfoInternal();
	return null;
}

function renderMarketsInfo(): UseMarketsInfoReturn {
	rendered.info = undefined;
	renderToString(
		<MarketsProvider>
			<Probe />
		</MarketsProvider>,
	);
	if (!rendered.info) throw new Error("useMarketsInfoInternal did not render");
	return rendered.info;
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
});
