import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type MetaPayloads, parseMarkets } from "@/domain/market/model";
import { buildAccountState, getTradeCollateral, parseAccountMode } from "@/domain/trade/account-mode";
import { deriveOrderEntry, type OrderEntryInputs } from "@/domain/trade/order/derive";
import type { AccountFixture } from "@/test/account-fixture";

const snapshot: MetaPayloads = JSON.parse(
	readFileSync(new URL("../../../../fixtures/hl-mainnet-meta.json", import.meta.url), "utf8"),
);
const model = parseMarkets(snapshot);

function entryFor(coin: string) {
	const inputs: OrderEntryInputs = {
		isConnected: false,
		market: model.byName.get(coin),
		side: "buy",
		conversionPrice: 0,
		sizeMode: "base",
		size: "",
		sizeUnit: null,
		collateral: { status: "pending", reason: "account" },
	};
	return deriveOrderEntry(inputs);
}

describe("ticket asset label", () => {
	it("names the dex of a builder perp so two listings never read alike", () => {
		expect(entryFor("io:NVDA").assetLabel).toBe("io:NVDA");
		expect(entryFor("xyz:NVDA").assetLabel).toBe("xyz:NVDA");
	});

	it("keeps the short name for main perps and the base token for spot", () => {
		expect(entryFor("BTC").assetLabel).toBe("BTC");
		expect(entryFor("@107").assetLabel).toBe("HYPE");
	});
});

describe("builder perp collateral on a standard account", () => {
	it("never reads spot USDC as xyz margin", () => {
		const p3: AccountFixture = JSON.parse(
			readFileSync(new URL("../__fixtures__/account/p3-default.json", import.meta.url), "utf8"),
		);
		const account = buildAccountState({
			user: p3.user,
			spotCurrent: true,
			perpCurrent: true,
			mode: parseAccountMode(p3.webData3UserState.abstraction),
			clearinghouseStates: p3.clearinghouseStates,
			spot: { balances: [{ coin: "USDC", token: 0, total: "73414", hold: "0", entryNtl: "0" }] },
		});
		const market = model.byName.get("xyz:NVDA");
		if (!market) throw new Error("xyz:NVDA missing from the snapshot");
		const entry = deriveOrderEntry({
			isConnected: true,
			market,
			side: "buy",
			conversionPrice: 171.07,
			sizeMode: "base",
			size: "",
			sizeUnit: null,
			collateral: getTradeCollateral(account, market, "buy", {
				status: "live",
				quote: p3.activeAssetData["xyz:NVDA"],
				applied: null,
			}),
		});

		expect(entry.availableBalance).toBe(0);
		expect(entry.spotBalance.quoteAvailable).toBe(0);
		expect(entry.collateral.status === "ready" && entry.collateral.shortfall?.kind).toBe("dexEmpty");
	});
});
