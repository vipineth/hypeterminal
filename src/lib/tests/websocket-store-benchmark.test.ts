import { afterEach, describe, expect, it } from "vitest";
import { createHyperliquidStore } from "@/lib/hyperliquid/store";
import type { HyperliquidConfig } from "@/lib/hyperliquid/types";
import { isPayloadOversized } from "@/lib/websocket/payload-guard";
import { WS_RELIABILITY_LIMITS } from "@/lib/websocket/reliability";

type BenchResult = {
	name: string;
	durationMs: number;
	heapDeltaBytes: number;
	peakHeapBytes: number;
	unhandledRejections: number;
	successfulRecoveries?: number;
	subscribeCalls?: number;
	droppedPayloads?: number;
};

const EMPTY_CONFIG: HyperliquidConfig = {
	ssr: false,
};

function maybeGc() {
	const gc = (globalThis as { gc?: () => void }).gc;
	gc?.();
}

function waitForMicrotasks() {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), 0);
	});
}

async function stabilizeHeap() {
	maybeGc();
	await waitForMicrotasks();
	maybeGc();
}

function memoryUsage() {
	return process.memoryUsage().heapUsed;
}

async function runChurnBenchmark(iterations: number, keySpace: number): Promise<BenchResult> {
	const store = createHyperliquidStore(EMPTY_CONFIG);
	let peakHeap = memoryUsage();
	let unhandledRejections = 0;

	const onUnhandled = () => {
		unhandledRejections += 1;
	};

	process.on("unhandledRejection", onUnhandled);

	try {
		await stabilizeHeap();
		const heapBefore = memoryUsage();
		const startedAt = performance.now();

		for (let i = 0; i < iterations; i += 1) {
			const key = `churn:${i % keySpace}:${i}`;
			store.getState().acquireSubscription(key, async () => ({
				unsubscribe: async () => {},
				failureSignal: new AbortController().signal,
			}));
			store.getState().releaseSubscription(key);
			if (i % 250 === 0) {
				await waitForMicrotasks();
				peakHeap = Math.max(peakHeap, memoryUsage());
			}
		}

		await waitForMicrotasks();
		await waitForMicrotasks();
		await stabilizeHeap();
		peakHeap = Math.max(peakHeap, memoryUsage());
		const endedAt = performance.now();
		const heapAfter = memoryUsage();

		expect(Object.keys(store.getState().subscriptions)).toHaveLength(0);

		return {
			name: "churn",
			durationMs: endedAt - startedAt,
			heapDeltaBytes: heapAfter - heapBefore,
			peakHeapBytes: peakHeap,
			unhandledRejections,
		};
	} finally {
		process.off("unhandledRejection", onUnhandled);
	}
}

async function runFailureBenchmark(iterations: number): Promise<BenchResult> {
	const store = createHyperliquidStore(EMPTY_CONFIG);
	let peakHeap = memoryUsage();
	let unhandledRejections = 0;

	const onUnhandled = () => {
		unhandledRejections += 1;
	};

	process.on("unhandledRejection", onUnhandled);

	try {
		await stabilizeHeap();
		const heapBefore = memoryUsage();
		const startedAt = performance.now();

		for (let i = 0; i < iterations; i += 1) {
			const key = `failure:${i}`;
			store.getState().acquireSubscription(key, async () => {
				throw new Error(`benchmark-failure-${i}`);
			});
			store.getState().releaseSubscription(key);
			if (i % 100 === 0) {
				await waitForMicrotasks();
				peakHeap = Math.max(peakHeap, memoryUsage());
			}
		}

		await waitForMicrotasks();
		await waitForMicrotasks();
		await stabilizeHeap();
		peakHeap = Math.max(peakHeap, memoryUsage());
		const endedAt = performance.now();
		const heapAfter = memoryUsage();

		expect(Object.keys(store.getState().subscriptions)).toHaveLength(0);

		return {
			name: "failure",
			durationMs: endedAt - startedAt,
			heapDeltaBytes: heapAfter - heapBefore,
			peakHeapBytes: peakHeap,
			unhandledRejections,
		};
	} finally {
		process.off("unhandledRejection", onUnhandled);
	}
}

async function runRecoveryBenchmark(iterations: number): Promise<BenchResult> {
	const store = createHyperliquidStore(EMPTY_CONFIG);
	let peakHeap = memoryUsage();
	let subscribeCalls = 0;
	let successfulRecoveries = 0;
	const controllers: AbortController[] = [];

	await stabilizeHeap();
	const heapBefore = memoryUsage();
	const startedAt = performance.now();

	store.getState().acquireSubscription("recovery:key", async () => {
		subscribeCalls += 1;
		const controller = new AbortController();
		controllers.push(controller);
		return {
			unsubscribe: async () => {},
			failureSignal: controller.signal,
		};
	});

	await waitForMicrotasks();

	let previousCalls = subscribeCalls;

	for (let i = 0; i < iterations; i += 1) {
		const current = controllers[controllers.length - 1];
		if (!current) break;
		current.abort(new Error(`disconnect-${i}`));
		await waitForMicrotasks();

		store.getState().acquireSubscription("recovery:key", async () => {
			subscribeCalls += 1;
			const controller = new AbortController();
			controllers.push(controller);
			return {
				unsubscribe: async () => {},
				failureSignal: controller.signal,
			};
		});
		store.getState().releaseSubscription("recovery:key");
		await waitForMicrotasks();

		if (subscribeCalls > previousCalls) {
			successfulRecoveries += 1;
			previousCalls = subscribeCalls;
		}

		if (i % 25 === 0) {
			peakHeap = Math.max(peakHeap, memoryUsage());
		}
	}

	store.getState().releaseSubscription("recovery:key");
	await waitForMicrotasks();
	await stabilizeHeap();
	peakHeap = Math.max(peakHeap, memoryUsage());
	const endedAt = performance.now();
	const heapAfter = memoryUsage();

	expect(Object.keys(store.getState().subscriptions)).toHaveLength(0);

	return {
		name: "recovery",
		durationMs: endedAt - startedAt,
		heapDeltaBytes: heapAfter - heapBefore,
		peakHeapBytes: peakHeap,
		unhandledRejections: 0,
		successfulRecoveries,
		subscribeCalls,
	};
}

async function runDataOverwriteBenchmark(iterations: number): Promise<BenchResult> {
	const store = createHyperliquidStore(EMPTY_CONFIG);
	let peakHeap = memoryUsage();
	const key = "data:key";

	await stabilizeHeap();
	const heapBefore = memoryUsage();
	const startedAt = performance.now();

	store.getState().acquireSubscription(key, async () => ({
		unsubscribe: async () => {},
		failureSignal: new AbortController().signal,
	}));

	await waitForMicrotasks();

	for (let i = 0; i < iterations; i += 1) {
		store.getState().setSubscriptionData(key, {
			sequence: i,
			payload: `tick-${i % 128}`,
			bids: [
				{ px: i, sz: i % 10 },
				{ px: i + 1, sz: (i + 1) % 10 },
			],
		});
		if (i % 500 === 0) {
			await waitForMicrotasks();
			peakHeap = Math.max(peakHeap, memoryUsage());
		}
	}

	const stablePayload = { sequence: -1, payload: "stable" };
	for (let i = 0; i < 1000; i += 1) {
		store.getState().setSubscriptionData(key, stablePayload);
	}

	await waitForMicrotasks();
	peakHeap = Math.max(peakHeap, memoryUsage());

	expect(Object.keys(store.getState().subscriptions)).toHaveLength(1);

	store.getState().releaseSubscription(key);
	await waitForMicrotasks();
	await stabilizeHeap();
	peakHeap = Math.max(peakHeap, memoryUsage());
	const endedAt = performance.now();
	const heapAfter = memoryUsage();

	expect(Object.keys(store.getState().subscriptions)).toHaveLength(0);

	return {
		name: "data-overwrite",
		durationMs: endedAt - startedAt,
		heapDeltaBytes: heapAfter - heapBefore,
		peakHeapBytes: peakHeap,
		unhandledRejections: 0,
	};
}

async function runPayloadGuardBenchmark(iterations: number): Promise<BenchResult> {
	let peakHeap = memoryUsage();
	let droppedPayloads = 0;
	const limit = WS_RELIABILITY_LIMITS.payload.defaultMaxBytes;
	const smallPayload = {
		channel: "trades",
		items: Array.from({ length: 25 }, (_, i) => ({ px: i, sz: i + 1 })),
	};
	const largePayload = {
		channel: "l2Book",
		blob: "x".repeat(limit * 2),
	};

	await stabilizeHeap();
	const heapBefore = memoryUsage();
	const startedAt = performance.now();

	for (let i = 0; i < iterations; i += 1) {
		const payload = i % 3 === 0 ? largePayload : smallPayload;
		const result = isPayloadOversized(payload, limit);
		if (result.oversized) {
			droppedPayloads += 1;
		}

		if (i % 200 === 0) {
			await waitForMicrotasks();
			peakHeap = Math.max(peakHeap, memoryUsage());
		}
	}

	await stabilizeHeap();
	peakHeap = Math.max(peakHeap, memoryUsage());
	const endedAt = performance.now();
	const heapAfter = memoryUsage();

	expect(droppedPayloads).toBeGreaterThan(0);

	return {
		name: "payload-guard",
		durationMs: endedAt - startedAt,
		heapDeltaBytes: heapAfter - heapBefore,
		peakHeapBytes: peakHeap,
		unhandledRejections: 0,
		droppedPayloads,
	};
}

function formatMb(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function printBenchmarkResults(results: BenchResult[]) {
	const formatted = results.map((result) => ({
		scenario: result.name,
		durationMs: Number(result.durationMs.toFixed(1)),
		heapDelta: formatMb(result.heapDeltaBytes),
		peakHeap: formatMb(result.peakHeapBytes),
		unhandledRejections: result.unhandledRejections,
		subscribeCalls: result.subscribeCalls ?? null,
		successfulRecoveries: result.successfulRecoveries ?? null,
		droppedPayloads: result.droppedPayloads ?? null,
	}));
	console.table(formatted);
}

describe("websocket store benchmark", () => {
	afterEach(async () => {
		await stabilizeHeap();
	});

	it("captures baseline memory and rejection metrics", async () => {
		const churn = await runChurnBenchmark(5000, 64);
		const failure = await runFailureBenchmark(600);
		const recovery = await runRecoveryBenchmark(200);
		const dataOverwrite = await runDataOverwriteBenchmark(15_000);
		const payloadGuard = await runPayloadGuardBenchmark(12_000);
		printBenchmarkResults([churn, failure, recovery, dataOverwrite, payloadGuard]);

		expect(churn.durationMs).toBeGreaterThan(0);
		expect(failure.durationMs).toBeGreaterThan(0);
		expect(recovery.durationMs).toBeGreaterThan(0);
		expect(dataOverwrite.durationMs).toBeGreaterThan(0);
		expect(payloadGuard.durationMs).toBeGreaterThan(0);
	});
});
