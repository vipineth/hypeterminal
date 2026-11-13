import { readFileSync } from "node:fs";
import type { LiveMetaSnapshot } from "../../apps/terminal/src/domain/trade/live-plan-set.ts";

const TERMINAL_DIR = new URL("../../apps/terminal/", import.meta.url).pathname;
const SNAPSHOT_PATH = `${TERMINAL_DIR}fixtures/hl-mainnet-meta.json`;
const WARMUP_PASSES = 20;
const MEASURED_PASSES = 50;
const PLAN_BUDGET_MS = 1;

// Bun resolves the terminal's "@/" aliases from the tsconfig in the working directory.
process.chdir(TERMINAL_DIR);
const { buildOrderPlan } = await import("../../apps/terminal/src/domain/trade/order-intent.ts");
const { buildLiveCases } = await import("../../apps/terminal/src/domain/trade/live-plan-set.ts");

function quantile(sorted: Float64Array, q: number): number {
	return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

function micros(ms: number): string {
	return `${(ms * 1000).toFixed(2)}us`;
}

const snapshot: LiveMetaSnapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
const cases = buildLiveCases(snapshot);
const plans = cases.length;

const coldStart = performance.now();
buildOrderPlan(cases[0].intent);
const coldMs = performance.now() - coldStart;

for (let pass = 0; pass < WARMUP_PASSES; pass += 1) {
	for (const planCase of cases) buildOrderPlan(planCase.intent);
}

const samples = new Float64Array(MEASURED_PASSES * plans);
const passTotals = new Float64Array(MEASURED_PASSES);
let legs = 0;
let rejected = 0;
for (let pass = 0; pass < MEASURED_PASSES; pass += 1) {
	const passStart = performance.now();
	for (let i = 0; i < plans; i += 1) {
		const start = performance.now();
		const plan = buildOrderPlan(cases[i].intent);
		samples[pass * plans + i] = performance.now() - start;
		legs += plan.orders.length;
		if (plan.errors.length > 0) rejected += 1;
	}
	passTotals[pass] = performance.now() - passStart;
}

const perPlanMedians = new Float64Array(plans);
const column = new Float64Array(MEASURED_PASSES);
for (let i = 0; i < plans; i += 1) {
	for (let pass = 0; pass < MEASURED_PASSES; pass += 1) column[pass] = samples[pass * plans + i];
	perPlanMedians[i] = column.sort()[Math.floor(MEASURED_PASSES / 2)];
}
const slowestPlan = perPlanMedians.indexOf(Math.max(...perPlanMedians));
const slowestCase = cases[slowestPlan];
const sortedSamples = samples.slice().sort();
const sortedTotals = passTotals.slice().sort();
const meanMs = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;

console.log(`plans ${plans}, passes ${MEASURED_PASSES} after ${WARMUP_PASSES} warmup, snapshot ${snapshot.fetchedAt}`);
console.log(`per plan: median ${micros(quantile(sortedSamples, 0.5))} mean ${micros(meanMs)} p99 ${micros(quantile(sortedSamples, 0.99))} max ${micros(sortedSamples[sortedSamples.length - 1])}`);
console.log(`slowest plan median ${micros(perPlanMedians[slowestPlan])}: ${slowestCase.label} ${slowestCase.side} ${slowestCase.market.name}`);
console.log(`pass over all plans: median ${quantile(sortedTotals, 0.5).toFixed(2)}ms, range ${sortedTotals[0].toFixed(2)} to ${sortedTotals[sortedTotals.length - 1].toFixed(2)}ms`);
console.log(`cold first call ${micros(coldMs)}`);
console.log(`work per pass: ${legs / MEASURED_PASSES} legs built, ${rejected / MEASURED_PASSES} plans rejected`);

process.exit(perPlanMedians[slowestPlan] > PLAN_BUDGET_MS ? 1 : 0);
