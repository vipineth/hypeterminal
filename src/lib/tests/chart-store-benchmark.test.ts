import { afterEach, describe, expect, it } from "vitest";
import { createCandleStore } from "@/lib/chart/store";
import type { Bar } from "@/types/charting_library";

type BenchResult = {
	scenario: string;
	durationMs: number;
	heapDeltaBytes: number;
	peakHeapBytes: number;
	cacheSize: number;
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

function createBar(index: number): Bar {
	return {
		time: index * 60_000,
		open: index,
		high: index + 1,
		low: index - 1,
		close: index + 0.5,
		volume: index % 50,
	};
}

async function runCacheCapBenchmark(entries: number): Promise<BenchResult> {
	const store = createCandleStore();
	let peakHeap = memoryUsage();

	await stabilizeHeap();
	const heapBefore = memoryUsage();
	const startedAt = performance.now();

	for (let i = 0; i < entries; i += 1) {
		store.getState().setLastBar(`coin-${i}:1m`, createBar(i));
		if (i % 100 === 0) {
			peakHeap = Math.max(peakHeap, memoryUsage());
		}
	}

	await stabilizeHeap();
	peakHeap = Math.max(peakHeap, memoryUsage());
	const endedAt = performance.now();
	const heapAfter = memoryUsage();
	const cacheSize = Object.keys(store.getState().lastBarCache).length;

	return {
		scenario: "cache-cap",
		durationMs: endedAt - startedAt,
		heapDeltaBytes: heapAfter - heapBefore,
		peakHeapBytes: peakHeap,
		cacheSize,
	};
}

async function runCacheReuseBenchmark(updates: number): Promise<BenchResult> {
	const store = createCandleStore();
	let peakHeap = memoryUsage();

	await stabilizeHeap();
	const heapBefore = memoryUsage();
	const startedAt = performance.now();

	for (let i = 0; i < updates; i += 1) {
		store.getState().setLastBar("coin-reuse:1m", createBar(i));
		if (i % 500 === 0) {
			peakHeap = Math.max(peakHeap, memoryUsage());
		}
	}

	await stabilizeHeap();
	peakHeap = Math.max(peakHeap, memoryUsage());
	const endedAt = performance.now();
	const heapAfter = memoryUsage();
	const cacheSize = Object.keys(store.getState().lastBarCache).length;

	return {
		scenario: "cache-reuse",
		durationMs: endedAt - startedAt,
		heapDeltaBytes: heapAfter - heapBefore,
		peakHeapBytes: peakHeap,
		cacheSize,
	};
}

function formatMb(bytes: number): string {
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

describe("chart store benchmark", () => {
	afterEach(async () => {
		await stabilizeHeap();
	});

	it("keeps chart caches bounded and reusable", async () => {
		const cap = await runCacheCapBenchmark(2_000);
		const reuse = await runCacheReuseBenchmark(30_000);

		console.table([
			{
				scenario: cap.scenario,
				durationMs: Number(cap.durationMs.toFixed(1)),
				heapDelta: formatMb(cap.heapDeltaBytes),
				peakHeap: formatMb(cap.peakHeapBytes),
				cacheSize: cap.cacheSize,
			},
			{
				scenario: reuse.scenario,
				durationMs: Number(reuse.durationMs.toFixed(1)),
				heapDelta: formatMb(reuse.heapDeltaBytes),
				peakHeap: formatMb(reuse.peakHeapBytes),
				cacheSize: reuse.cacheSize,
			},
		]);

		expect(cap.cacheSize).toBeLessThanOrEqual(256);
		expect(reuse.cacheSize).toBe(1);
	});
});
