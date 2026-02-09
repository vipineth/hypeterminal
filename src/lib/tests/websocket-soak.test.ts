import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCandleStore } from "@/lib/chart/store";
import { createHyperliquidStore } from "@/lib/hyperliquid/store";
import type { HyperliquidConfig } from "@/lib/hyperliquid/types";
import { isPayloadOversized } from "@/lib/websocket/payload-guard";
import { getPayloadLimitBytesForSubscriptionKey, WS_RELIABILITY_LIMITS } from "@/lib/websocket/reliability";

type SoakSample = {
	elapsedMs: number;
	heapUsedBytes: number;
	rssBytes: number;
	externalBytes: number;
	subscriptionsTotal: number;
	subscriptionsActive: number;
	subscriptionsConnecting: number;
	subscriptionsError: number;
	chartCacheSize: number;
	droppedPayloads: number;
	abortCount: number;
	recoveryTransitions: number;
};

type SoakSummary = {
	durationMs: number;
	iterations: number;
	subscribeCalls: number;
	unsubscribeCalls: number;
	abortCount: number;
	droppedPayloads: number;
	recoveryTransitions: number;
	maxSubscriptionsTotal: number;
	maxChartCacheSize: number;
	startHeapBytes: number;
	endHeapBytes: number;
	maxHeapBytes: number;
	heapDeltaBytes: number;
	heapGrowthMbPerHour: number;
	unhandledRejections: number;
	reportPath: string;
};

type SoakReport = {
	generatedAt: string;
	config: {
		durationMs: number;
		operationIntervalMs: number;
		sampleIntervalMs: number;
		keyPoolSize: number;
	};
	summary: SoakSummary;
	samples: SoakSample[];
};

const EMPTY_CONFIG: HyperliquidConfig = { ssr: false };

const DEFAULT_SOAK_DURATION_MS = 30 * 60_000;
const DEFAULT_SOAK_OPERATION_INTERVAL_MS = 10;
const DEFAULT_SOAK_SAMPLE_INTERVAL_MS = 1_000;
const DEFAULT_SOAK_KEY_POOL_SIZE = 320;
const DEFAULT_SOAK_TIMEOUT_BUFFER_MS = 20_000;

const METHOD_POOL = ["l2Book", "trades", "allMids", "assetCtxs", "allDexsAssetCtxs"] as const;

function readPositiveIntEnv(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nowMs() {
	return Date.now();
}

function sleep(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

function maybeGc() {
	const gc = (globalThis as { gc?: () => void }).gc;
	gc?.();
}

async function stabilizeHeap() {
	maybeGc();
	await sleep(0);
	maybeGc();
}

function randomInt(maxExclusive: number): number {
	return Math.floor(Math.random() * maxExclusive);
}

function pickRandom<T>(items: T[]): T | undefined {
	if (items.length === 0) return undefined;
	return items[randomInt(items.length)];
}

function createSubscriptionKeys(size: number): string[] {
	const keys: string[] = [];
	for (let i = 0; i < size; i += 1) {
		const method = METHOD_POOL[i % METHOD_POOL.length];
		keys.push(
			JSON.stringify([
				"hl",
				"subscription",
				method,
				{
					coin: `COIN-${i % 80}`,
					dex: "default",
				},
			]),
		);
	}
	return keys;
}

function createSmallPayload(sequence: number) {
	return {
		sequence,
		kind: "tick",
		bids: [
			{ px: sequence, sz: (sequence % 10) + 1 },
			{ px: sequence + 1, sz: (sequence % 10) + 2 },
		],
		asks: [
			{ px: sequence + 2, sz: (sequence % 10) + 3 },
			{ px: sequence + 3, sz: (sequence % 10) + 4 },
		],
	};
}

function createLargePayload(limit: number) {
	return {
		kind: "oversized",
		blob: "x".repeat(limit * 2),
	};
}

function countStatuses(subscriptions: Record<string, { status: string }>) {
	let active = 0;
	let connecting = 0;
	let error = 0;
	for (const entry of Object.values(subscriptions)) {
		if (entry.status === "active") active += 1;
		else if (entry.status === "subscribing") connecting += 1;
		else if (entry.status === "error") error += 1;
	}
	return { active, connecting, error };
}

function computeHeapGrowthMbPerHour(samples: SoakSample[]): number {
	if (samples.length < 2) return 0;
	const first = samples[0];
	const last = samples[samples.length - 1];
	const elapsedHours = (last.elapsedMs - first.elapsedMs) / (60 * 60 * 1000);
	if (elapsedHours <= 0) return 0;
	const deltaMb = (last.heapUsedBytes - first.heapUsedBytes) / (1024 * 1024);
	return Number((deltaMb / elapsedHours).toFixed(3));
}

describe("websocket soak", () => {
	afterEach(async () => {
		await stabilizeHeap();
	});

	const soakTimeoutMs =
		readPositiveIntEnv("WS_SOAK_DURATION_MS", DEFAULT_SOAK_DURATION_MS) + DEFAULT_SOAK_TIMEOUT_BUFFER_MS;

	it.skipIf(process.env.WS_SOAK_RUN !== "true")(
		"runs long-running websocket soak and writes JSON report",
		async () => {
			const durationMs = readPositiveIntEnv("WS_SOAK_DURATION_MS", DEFAULT_SOAK_DURATION_MS);
			const operationIntervalMs = readPositiveIntEnv("WS_SOAK_OP_MS", DEFAULT_SOAK_OPERATION_INTERVAL_MS);
			const sampleIntervalMs = readPositiveIntEnv("WS_SOAK_SAMPLE_MS", DEFAULT_SOAK_SAMPLE_INTERVAL_MS);
			const keyPoolSize = readPositiveIntEnv("WS_SOAK_KEY_POOL", DEFAULT_SOAK_KEY_POOL_SIZE);
			const outputDir = process.env.WS_SOAK_OUTPUT_DIR ?? ".output";

			const subscriptionsStore = createHyperliquidStore(EMPTY_CONFIG);
			const chartStore = createCandleStore();
			const keyPool = createSubscriptionKeys(keyPoolSize);
			const refs = new Map<string, number>();
			const controllers = new Map<string, AbortController>();
			const subscribeFnByKey = new Map<
				string,
				() => Promise<{ unsubscribe: () => Promise<void>; failureSignal: AbortSignal }>
			>();
			const statusSnapshot = new Map<string, string>();
			const samples: SoakSample[] = [];

			let droppedPayloads = 0;
			let subscribeCalls = 0;
			let unsubscribeCalls = 0;
			let abortCount = 0;
			let recoveryTransitions = 0;
			let iteration = 0;
			let maxSubscriptionsTotal = 0;
			let maxChartCacheSize = 0;
			let maxHeapBytes = 0;
			let unhandledRejections = 0;

			const onUnhandled = () => {
				unhandledRejections += 1;
			};
			process.on("unhandledRejection", onUnhandled);

			const ensureSubscribeFn = (key: string) => {
				const existing = subscribeFnByKey.get(key);
				if (existing) return existing;

				const created = async () => {
					subscribeCalls += 1;
					const controller = new AbortController();
					controllers.set(key, controller);
					return {
						unsubscribe: async () => {
							unsubscribeCalls += 1;
						},
						failureSignal: controller.signal,
					};
				};
				subscribeFnByKey.set(key, created);
				return created;
			};

			const acquire = (key: string) => {
				const ref = refs.get(key) ?? 0;
				if (ref >= 2) return;
				refs.set(key, ref + 1);
				subscriptionsStore.getState().acquireSubscription(key, ensureSubscribeFn(key));
			};

			const release = (key: string) => {
				const ref = refs.get(key) ?? 0;
				if (ref <= 0) return;
				subscriptionsStore.getState().releaseSubscription(key);
				if (ref === 1) refs.delete(key);
				else refs.set(key, ref - 1);
			};

			const updatePayload = (key: string) => {
				const limit = getPayloadLimitBytesForSubscriptionKey(key);
				const useLargePayload = Math.random() < 0.2;
				const payload = useLargePayload ? createLargePayload(limit) : createSmallPayload(iteration);
				const payloadResult = isPayloadOversized(payload, limit);
				if (payloadResult.oversized) {
					droppedPayloads += 1;
					return;
				}
				subscriptionsStore.getState().setSubscriptionData(key, payload);
			};

			const abortOne = () => {
				const abortable = Array.from(controllers.entries()).filter(([, ctrl]) => !ctrl.signal.aborted);
				const picked = pickRandom(abortable);
				if (!picked) return;
				const [key, controller] = picked;
				controller.abort(new Error("soak-simulated-disconnect"));
				abortCount += 1;
				controllers.delete(key);
			};

			const touchChartCache = () => {
				const keyA = `chart:${iteration % 500}:1m`;
				const keyB = `chart:${(iteration + 13) % 500}:5m`;

				chartStore.getState().setLastBar(keyA, {
					time: iteration * 60_000,
					open: iteration,
					high: iteration + 1,
					low: iteration - 1,
					close: iteration + 0.5,
					volume: iteration % 100,
				});
				void chartStore.getState().getLastBar(keyB);
			};

			const collectSample = (elapsedMs: number) => {
				const memory = process.memoryUsage();
				const subscriptions = subscriptionsStore.getState().subscriptions;
				const chartCacheSize = Object.keys(chartStore.getState().lastBarCache).length;
				const { active, connecting, error } = countStatuses(subscriptions);

				maxHeapBytes = Math.max(maxHeapBytes, memory.heapUsed);
				maxSubscriptionsTotal = Math.max(maxSubscriptionsTotal, Object.keys(subscriptions).length);
				maxChartCacheSize = Math.max(maxChartCacheSize, chartCacheSize);

				for (const [key, entry] of Object.entries(subscriptions)) {
					const previous = statusSnapshot.get(key);
					if (previous === "error" && entry.status === "active") {
						recoveryTransitions += 1;
					}
					statusSnapshot.set(key, entry.status);
				}
				for (const key of Array.from(statusSnapshot.keys())) {
					if (!subscriptions[key]) statusSnapshot.delete(key);
				}

				samples.push({
					elapsedMs,
					heapUsedBytes: memory.heapUsed,
					rssBytes: memory.rss,
					externalBytes: memory.external,
					subscriptionsTotal: Object.keys(subscriptions).length,
					subscriptionsActive: active,
					subscriptionsConnecting: connecting,
					subscriptionsError: error,
					chartCacheSize,
					droppedPayloads,
					abortCount,
					recoveryTransitions,
				});
			};

			await stabilizeHeap();
			const soakStart = nowMs();
			let nextSampleAt = soakStart;
			const startHeapBytes = process.memoryUsage().heapUsed;
			maxHeapBytes = startHeapBytes;

			try {
				while (nowMs() - soakStart < durationMs) {
					iteration += 1;

					const actionRoll = Math.random();
					const key = keyPool[randomInt(keyPool.length)];

					if (actionRoll < 0.22) {
						acquire(key);
					} else if (actionRoll < 0.4) {
						const activeKeys = Array.from(refs.keys());
						const releaseKey = pickRandom(activeKeys);
						if (releaseKey) release(releaseKey);
					} else if (actionRoll < 0.85) {
						const activeKeys = Array.from(refs.keys());
						const updateKey = pickRandom(activeKeys);
						if (updateKey) updatePayload(updateKey);
					} else {
						abortOne();
					}

					touchChartCache();

					const now = nowMs();
					if (now >= nextSampleAt) {
						collectSample(now - soakStart);
						nextSampleAt = now + sampleIntervalMs;
					}

					await sleep(operationIntervalMs);
				}
			} finally {
				for (const [key, refCount] of refs.entries()) {
					for (let i = 0; i < refCount; i += 1) {
						subscriptionsStore.getState().releaseSubscription(key);
					}
				}
				refs.clear();
				process.off("unhandledRejection", onUnhandled);
			}

			await sleep(50);
			await stabilizeHeap();
			collectSample(nowMs() - soakStart);

			const endHeapBytes = process.memoryUsage().heapUsed;
			const reportDate = new Date();
			const reportFileName = `websocket-soak-${reportDate.toISOString().replace(/[:.]/g, "-")}.json`;
			const reportPath = path.join(outputDir, reportFileName);

			const summary: SoakSummary = {
				durationMs,
				iterations: iteration,
				subscribeCalls,
				unsubscribeCalls,
				abortCount,
				droppedPayloads,
				recoveryTransitions,
				maxSubscriptionsTotal,
				maxChartCacheSize,
				startHeapBytes,
				endHeapBytes,
				maxHeapBytes,
				heapDeltaBytes: endHeapBytes - startHeapBytes,
				heapGrowthMbPerHour: computeHeapGrowthMbPerHour(samples),
				unhandledRejections,
				reportPath,
			};

			const report: SoakReport = {
				generatedAt: reportDate.toISOString(),
				config: {
					durationMs,
					operationIntervalMs,
					sampleIntervalMs,
					keyPoolSize,
				},
				summary,
				samples,
			};

			await mkdir(outputDir, { recursive: true });
			await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

			console.log(
				`[Soak] duration=${durationMs}ms heapDelta=${(summary.heapDeltaBytes / (1024 * 1024)).toFixed(2)}MB maxSubs=${summary.maxSubscriptionsTotal} maxChartCache=${summary.maxChartCacheSize} droppedPayloads=${summary.droppedPayloads} report=${reportPath}`,
			);

			expect(summary.maxSubscriptionsTotal).toBeLessThanOrEqual(WS_RELIABILITY_LIMITS.subscriptions.maxTrackedKeys);
			expect(summary.maxChartCacheSize).toBeLessThanOrEqual(WS_RELIABILITY_LIMITS.cache.maxChartLastBarEntries);
			expect(summary.recoveryTransitions).toBeGreaterThan(0);
			expect(summary.unhandledRejections).toBe(0);
		},
		soakTimeoutMs,
	);
});
