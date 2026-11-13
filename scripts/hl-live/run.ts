import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { listLiveMarkets, type LiveMetaSnapshot } from "@/domain/trade/live-plan-set";
import { toSafeBig } from "@/lib/trade/numbers";
import { acquireLock, cleanVenue, exitUnified, enterUnified, loadVenue, SPOT_DEX, spotBalance, type VenueSpec } from "./account";
import { errorMessage, validateOrder } from "./assert";
import { collectDrift, DRIFT_SNAPSHOT_PATH, type DriftShape, diffDrift, fetchDriftInputs, mergeDrift } from "./drift";
import { createHarness, type Harness, loadKeys } from "./harness";
import { lotSize, readonlyPlans, TWAP_NOTIONAL, twapPlan } from "./plans";
import { type Scenario, type Scope, Unsupported } from "./scenarios/common";
import { orderScenarios } from "./scenarios/orders";
import { positionScenarios, resetLeverage } from "./scenarios/positions";
import { spotScenarios } from "./scenarios/spot";
import { transferScenarios } from "./scenarios/transfers";

const MIN_FUNDING_USDC = 100;
const SPOT_FLOAT_MIN = 20;
const SPOT_FLOAT_TARGET = 30;
const PRINCIPAL_ADDRESS = "0x9fED7c631d8d525Ce642402C0e36A73cf5C77c1c";

const SCENARIOS: Scenario[] = [...orderScenarios, ...positionScenarios, ...transferScenarios, ...spotScenarios];

type Result = { scenario: string; venue: string; status: "pass" | "fail" | "unsupported"; detail: string; ms: number };

const { values } = parseArgs({
	options: {
		testnet: { type: "boolean", default: false },
		readonly: { type: "boolean", default: false },
		drift: { type: "boolean", default: false },
		"write-drift-snapshot": { type: "boolean", default: false },
		main: { type: "string", default: "DOGE" },
		builder: { type: "string", default: "xyz:NVDA" },
		spot: { type: "string", default: "PURR/USDC" },
		only: { type: "string" },
	},
});

const RATE_LIMIT_RETRIES = 5;

function retryRateLimitedReads(): void {
	const realFetch = globalThis.fetch;
	globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
		const url = input instanceof Request ? input.url : String(input);
		for (let attempt = 0; ; attempt++) {
			const response = await realFetch(input, init);
			if (response.status !== 429 || !url.endsWith("/info") || attempt === RATE_LIMIT_RETRIES) return response;
			await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
		}
	}) as typeof fetch;
}

function elapsed(start: number): string {
	return `${((performance.now() - start) / 1000).toFixed(1)}s`;
}

async function runScenario(h: Harness, scenario: Scenario, spec: VenueSpec, agentApproved: boolean): Promise<Result> {
	const started = performance.now();
	const result = (status: Result["status"], detail = ""): Result => ({
		scenario: scenario.name,
		venue: spec.label,
		status,
		detail,
		ms: performance.now() - started,
	});
	if (scenario.signer === "agent" && !agentApproved) {
		return result("fail", `agent ${h.agentAddress} is not approved for ${h.user}, approve hl-live first`);
	}
	try {
		await scenario.run({ h, venue: await loadVenue(h.info, spec) });
		return result("pass");
	} catch (error) {
		if (error instanceof Unsupported) return result("unsupported", error.message);
		return result("fail", errorMessage(error).split("\n")[0]);
	} finally {
		if (scenario.scope !== "account") await cleanVenue(h, spec);
	}
}

function printResult({ scenario, venue, status, detail, ms }: Result): void {
	const label = { pass: "PASS", fail: "FAIL", unsupported: "SKIP" }[status];
	console.log(`${label} ${scenario} @ ${venue} (${(ms / 1000).toFixed(1)}s)${detail ? ` ${detail}` : ""}`);
}

async function runTestnet(): Promise<number> {
	const started = performance.now();
	retryRateLimitedReads();
	const h = createHarness(new HttpTransport({ isTestnet: true, timeout: 30_000 }), loadKeys());
	const releaseLock = acquireLock(h.user);
	try {
		const perp = toSafeBig((await h.info.clearinghouseState({ user: h.user })).marginSummary.accountValue);
		const funded = perp.plus(toSafeBig(await spotBalance(h, "USDC")));
		if (funded.lt(MIN_FUNDING_USDC)) {
			console.log(`STOP principal ${h.user} holds ${funded.toFixed(2)} testnet USDC, needs ${MIN_FUNDING_USDC}. Fund it from the testnet faucet or fund-testnet.mjs, then rerun.`);
			return 2;
		}
		const agents = await h.info.extraAgents({ user: h.user });
		const agentApproved = agents.some((agent) => agent.address.toLowerCase() === h.agentAddress.toLowerCase());
		console.log(`testnet principal ${h.user}, ${funded.toFixed(2)} USDC, agent ${h.agentAddress} ${agentApproved ? "approved" : "NOT approved"}`);

		const main: VenueSpec = { label: "main", dex: "", coin: values.main };
		const spot: VenueSpec = { label: "spot", dex: SPOT_DEX, coin: values.spot };
		const builderCoin = values.builder;
		const builder: VenueSpec | null = builderCoin
			? { label: builderCoin.split(":")[0], dex: builderCoin.split(":")[0], coin: builderCoin }
			: null;
		const only = values.only ? new Set(values.only.split(",")) : null;
		const selected = SCENARIOS.filter((scenario) => !only || only.has(scenario.name));
		const venuesFor: Record<Scope, VenueSpec[]> = { perp: [main], spot: [spot], account: [main] };

		await exitUnified(h);
		for (const spec of [main, spot]) await cleanVenue(h, spec);
		const spotUsdc = toSafeBig(await spotBalance(h, "USDC"));
		if (spotUsdc.lt(SPOT_FLOAT_MIN)) {
			await h.principal.usdClassTransfer({ amount: toSafeBig(SPOT_FLOAT_TARGET).minus(spotUsdc).round(2, 3).toFixed(), toPerp: false });
		}
		if (agentApproved) await resetLeverage({ h, venue: await loadVenue(h.info, main) });

		const results: Result[] = [];
		for (const scenario of selected) {
			for (const spec of venuesFor[scenario.scope]) {
				const result = await runScenario(h, scenario, spec, agentApproved);
				printResult(result);
				results.push(result);
			}
		}

		if (builder) {
			try {
				await enterUnified(h);
				await cleanVenue(h, builder);
				for (const scenario of selected.filter((entry) => entry.scope === "perp")) {
					const result = await runScenario(h, scenario, builder, agentApproved);
					printResult(result);
					results.push(result);
				}
			} finally {
				await exitUnified(h);
			}
		}

		const count = (status: Result["status"]) => results.filter((result) => result.status === status).length;
		console.log(`${count("pass")} passed, ${count("fail")} failed, ${count("unsupported")} unsupported by testnet, in ${elapsed(started)}`);
		return count("fail") === 0 ? 0 : 1;
	} finally {
		releaseLock();
	}
}

function forbidExchangeRequests(): void {
	const realFetch = globalThis.fetch;
	globalThis.fetch = ((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
		const url = input instanceof Request ? input.url : String(input);
		if (url.includes("/exchange")) throw new Error(`read-only mode refused a request to ${url}`);
		return realFetch(input, init);
	}) as typeof fetch;
}

async function fetchMainnetMeta(info: InfoClient): Promise<LiveMetaSnapshot> {
	const [perpDexs, [spotMeta, spotCtxs]] = await Promise.all([info.perpDexs(), info.spotMetaAndAssetCtxs()]);
	const perpCtxs = await Promise.all(perpDexs.map((dex) => info.metaAndAssetCtxs({ dex: dex?.name ?? "" })));
	return {
		fetchedAt: new Date().toISOString(),
		perpDexs,
		allPerpMetas: perpCtxs.map(([meta]) => meta),
		perpMarkPxs: perpCtxs.map(([, ctxs]) => ctxs.map((ctx) => ctx.markPx)),
		spotMeta,
		spotMarkPxs: spotCtxs.map((ctx) => ctx.markPx),
	};
}

async function runReadonly(): Promise<number> {
	const started = performance.now();
	forbidExchangeRequests();
	const info = new InfoClient({ transport: new HttpTransport({ timeout: 30_000 }) });
	const markets = listLiveMarkets(await fetchMainnetMeta(info));
	let plans = 0;
	const problems: string[] = [];
	const blocked: string[] = [];
	for (const market of markets) {
		const planMarket = { ...market, markPx: market.markPx.toFixed() };
		for (const { label, plan } of readonlyPlans(planMarket)) {
			plans += 1;
			if (plan.errors.length > 0) {
				blocked.push(`${market.name} ${label}: ${plan.errors.join(", ")} (mark ${planMarket.markPx})`);
				continue;
			}
			for (const order of plan.orders) {
				for (const problem of validateOrder(order, market.kind, market.szDecimals, planMarket.markPx)) {
					problems.push(`${market.name} ${label}: ${problem}`);
				}
			}
		}
		if (market.kind !== "spot") {
			plans += 1;
			const twap = twapPlan(planMarket, "buy", lotSize(planMarket, TWAP_NOTIONAL));
			if (!twap.action) blocked.push(`${market.name} twap: ${twap.errors.join(", ")}`);
		}
	}
	const invalid = new Set(problems.map((problem) => problem.split(":")[0])).size;
	console.log(
		`read-only mainnet: ${markets.length} markets, ${plans} plans built, ${invalid} invalid plans, ${blocked.length} blocked by the app, 0 requests to /exchange, in ${elapsed(started)}`,
	);
	for (const problem of problems.slice(0, 20)) console.log(`  invalid ${problem}`);
	for (const reason of blocked) console.log(`  blocked ${reason}`);
	return invalid === 0 ? 0 : 1;
}

async function runDrift(write: boolean): Promise<number> {
	const info = new InfoClient({ transport: new HttpTransport({ timeout: 30_000 }) });
	const live = collectDrift(await fetchDriftInputs(info, [PRINCIPAL_ADDRESS]));
	const snapshot = JSON.parse(readFileSync(DRIFT_SNAPSHOT_PATH, "utf8")) as DriftShape;
	if (write) {
		writeFileSync(DRIFT_SNAPSHOT_PATH, `${JSON.stringify(mergeDrift(snapshot, live), null, "\t")}\n`);
		console.log(`wrote ${DRIFT_SNAPSHOT_PATH}`);
		return 0;
	}
	const drift = diffDrift(snapshot, live);
	console.log(drift.length === 0 ? "drift: live mainnet matches the snapshot" : `drift: ${drift.length} change(s)`);
	for (const change of drift) console.log(`  ${change}`);
	return drift.length === 0 ? 0 : 1;
}

function pickMode(): Promise<number> {
	if (values.testnet) return runTestnet();
	if (values.readonly) return runReadonly();
	if (values.drift || values["write-drift-snapshot"]) return runDrift(values["write-drift-snapshot"]);
	console.log("usage: bun scripts/hl-live/run.ts --testnet | --readonly | --drift | --write-drift-snapshot");
	return Promise.resolve(2);
}

process.exit(await pickMode());
