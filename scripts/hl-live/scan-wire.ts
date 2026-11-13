import { readFileSync, writeFileSync } from "node:fs";
import type { MetaAndAssetCtxsResponse, MetaResponse, PerpDexsResponse, SpotMetaAndAssetCtxsResponse } from "@nktkas/hyperliquid";
import type { LiveMetaSnapshot } from "../../apps/terminal/src/domain/trade/live-plan-set.ts";

const TERMINAL_DIR = new URL("../../apps/terminal/", import.meta.url).pathname;
const SNAPSHOT_PATH = `${TERMINAL_DIR}fixtures/hl-mainnet-meta.json`;
const INFO_URL = "https://api.hyperliquid.xyz/info";
const SHOWN_VIOLATIONS = 20;

// Bun resolves the terminal's "@/" aliases from the tsconfig in the working directory.
process.chdir(TERMINAL_DIR);
const { buildOrderPlan } = await import("../../apps/terminal/src/domain/trade/order-intent.ts");
const { buildTwapPlan } = await import("../../apps/terminal/src/domain/trade/twap.ts");
const { buildLiveCases, buildTwapCases, checkCase, checkTwapCase, listLiveMarkets } = await import(
	"../../apps/terminal/src/domain/trade/live-plan-set.ts"
);

async function info<T>(body: Record<string, string>): Promise<T> {
	const response = await fetch(INFO_URL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!response.ok) throw new Error(`info ${JSON.stringify(body)} returned HTTP ${response.status}`);
	return (await response.json()) as T;
}

async function fetchSnapshot(): Promise<LiveMetaSnapshot> {
	const [perpDexs, allPerpMetas, [spotMeta, spotCtxs]] = await Promise.all([
		info<PerpDexsResponse>({ type: "perpDexs" }),
		info<MetaResponse[]>({ type: "allPerpMetas" }),
		info<SpotMetaAndAssetCtxsResponse>({ type: "spotMetaAndAssetCtxs" }),
	]);
	const perpCtxs = await Promise.all(
		perpDexs.map((dex) => info<MetaAndAssetCtxsResponse>({ type: "metaAndAssetCtxs", dex: dex?.name ?? "" })),
	);

	const perpMarkPxs = perpCtxs.map(([meta, ctxs], dexIndex) => {
		const names = meta.universe.map((asset) => asset.name).join();
		if (names !== allPerpMetas[dexIndex]?.universe.map((asset) => asset.name).join()) {
			throw new Error(`perp dex ${dexIndex} universe changed between requests, rerun`);
		}
		return ctxs.map((ctx) => ctx.markPx);
	});
	for (const pair of spotMeta.universe) {
		if (spotCtxs[pair.index]?.coin !== pair.name) throw new Error(`spot ctx ${pair.index} is not ${pair.name}`);
	}

	return {
		fetchedAt: new Date().toISOString(),
		perpDexs,
		allPerpMetas,
		perpMarkPxs,
		spotMeta,
		spotMarkPxs: spotCtxs.map((ctx) => ctx.markPx),
	};
}

const args = new Set(process.argv.slice(2));
const snapshot: LiveMetaSnapshot = args.has("--offline")
	? JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"))
	: await fetchSnapshot();

if (args.has("--write-snapshot")) {
	writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(snapshot)}\n`);
	console.log(`wrote ${SNAPSHOT_PATH}`);
}

const markets = listLiveMarkets(snapshot);
const cases = buildLiveCases(snapshot);
const twapCases = buildTwapCases(snapshot);
const planViolations = cases.map((planCase) => checkCase(planCase, buildOrderPlan(planCase.intent)));
const twapViolations = twapCases.map((twapCase) => checkTwapCase(twapCase, buildTwapPlan(twapCase.intent)));
const invalidPlans = planViolations.filter((problems) => problems.length > 0).length;
const invalidTwaps = twapViolations.filter((problems) => problems.length > 0).length;
const perpCount = markets.filter((market) => market.kind !== "spot").length;

console.log(`meta ${args.has("--offline") ? "snapshot" : "live mainnet"} at ${snapshot.fetchedAt}`);
console.log(`live markets: ${perpCount} perp + ${markets.length - perpCount} spot`);
console.log(`plans checked: ${cases.length}, twap payloads checked: ${twapCases.length}`);
console.log(`invalid plans: ${invalidPlans}, invalid twap payloads: ${invalidTwaps}`);
for (const problem of [...planViolations, ...twapViolations].flat().slice(0, SHOWN_VIOLATIONS)) console.log(`  ${problem}`);

process.exit(invalidPlans + invalidTwaps === 0 ? 0 : 1);
