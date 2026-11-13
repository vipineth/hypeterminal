import { readFileSync } from "node:fs";
import { type MetaPayloads, parseMarkets } from "../../apps/terminal/src/domain/market/model.ts";

const SNAPSHOT_PATH = new URL("../../apps/terminal/fixtures/hl-mainnet-meta.json", import.meta.url).pathname;
const WARMUP_PASSES = 50;
const MEASURED_PASSES = 500;

function quantile(sorted: Float64Array, q: number): number {
	return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

const raw = readFileSync(SNAPSHOT_PATH, "utf8");
const snapshot: MetaPayloads & { fetchedAt: string } = JSON.parse(raw);

const coldStart = performance.now();
const first = parseMarkets(snapshot);
const coldMs = performance.now() - coldStart;

for (let pass = 0; pass < WARMUP_PASSES; pass += 1) parseMarkets(snapshot);

const samples = new Float64Array(MEASURED_PASSES);
let markets = 0;
for (let pass = 0; pass < MEASURED_PASSES; pass += 1) {
	const start = performance.now();
	markets += parseMarkets(snapshot).byName.size;
	samples[pass] = performance.now() - start;
}
const sorted = samples.slice().sort();

console.log(`snapshot ${snapshot.fetchedAt}, ${raw.length} bytes, ${first.byName.size} markets by name`);
console.log(`passes ${MEASURED_PASSES} after ${WARMUP_PASSES} warmup, ${markets / MEASURED_PASSES} markets per pass`);
console.log(
	`model build: median ${quantile(sorted, 0.5).toFixed(3)}ms p90 ${quantile(sorted, 0.9).toFixed(3)}ms p99 ${quantile(sorted, 0.99).toFixed(3)}ms min ${sorted[0].toFixed(3)}ms`,
);
console.log(`cold first build ${coldMs.toFixed(3)}ms`);
