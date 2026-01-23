interface MemorySnapshot {
	timestamp: number;
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

const memorySnapshots: MemorySnapshot[] = [];
let intervalId: number | null = null;

function getMemoryInfo(): MemorySnapshot | null {
	if (!("memory" in performance)) {
		return null;
	}

	const memory = (performance as Performance & { memory: MemoryInfo }).memory;
	return {
		timestamp: Date.now(),
		usedJSHeapSize: memory.usedJSHeapSize,
		totalJSHeapSize: memory.totalJSHeapSize,
		jsHeapSizeLimit: memory.jsHeapSizeLimit,
	};
}

interface MemoryInfo {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

function formatBytes(bytes: number): string {
	const mb = bytes / (1024 * 1024);
	return `${mb.toFixed(2)} MB`;
}

export function takeMemorySnapshot(): MemorySnapshot | null {
	const snapshot = getMemoryInfo();
	if (snapshot) {
		memorySnapshots.push(snapshot);
		if (import.meta.env.DEV) {
			console.log(
				`%c[Memory] Snapshot: ${formatBytes(snapshot.usedJSHeapSize)} used / ${formatBytes(snapshot.totalJSHeapSize)} total`,
				"color: #888;",
			);
		}
	}
	return snapshot;
}

export function startMemoryMonitoring(intervalMs = 10000) {
	if (!("memory" in performance)) {
		console.warn("[Memory] Performance.memory API not available (Chrome only)");
		return;
	}

	if (intervalId !== null) {
		console.warn("[Memory] Monitoring already started");
		return;
	}

	takeMemorySnapshot();
	intervalId = window.setInterval(takeMemorySnapshot, intervalMs);

	if (import.meta.env.DEV) {
		console.log(`[Memory] Started monitoring every ${intervalMs / 1000}s`);
	}
}

export function stopMemoryMonitoring() {
	if (intervalId !== null) {
		clearInterval(intervalId);
		intervalId = null;
		console.log("[Memory] Stopped monitoring");
	}
}

export function getMemorySnapshots(): MemorySnapshot[] {
	return [...memorySnapshots];
}

export function clearMemorySnapshots() {
	memorySnapshots.length = 0;
}

export function analyzeMemoryTrend() {
	if (memorySnapshots.length < 2) {
		console.log("[Memory] Need at least 2 snapshots for trend analysis");
		return null;
	}

	const first = memorySnapshots[0];
	const last = memorySnapshots[memorySnapshots.length - 1];
	const durationMs = last.timestamp - first.timestamp;
	const durationMinutes = durationMs / 60000;

	const heapGrowth = last.usedJSHeapSize - first.usedJSHeapSize;
	const growthPerMinute = heapGrowth / durationMinutes;

	const result = {
		startHeap: first.usedJSHeapSize,
		endHeap: last.usedJSHeapSize,
		growth: heapGrowth,
		growthPerMinute,
		durationMinutes,
		snapshotCount: memorySnapshots.length,
		potentialLeak: growthPerMinute > 1024 * 1024, // >1MB/min is suspicious
	};

	if (import.meta.env.DEV) {
		console.group("[Memory] Trend Analysis");
		console.log(`Duration: ${durationMinutes.toFixed(1)} minutes`);
		console.log(`Start: ${formatBytes(result.startHeap)}`);
		console.log(`End: ${formatBytes(result.endHeap)}`);
		console.log(`Growth: ${formatBytes(result.growth)}`);
		console.log(`Growth rate: ${formatBytes(result.growthPerMinute)}/min`);
		if (result.potentialLeak) {
			console.warn("%cPotential memory leak detected!", "color: red; font-weight: bold;");
		}
		console.groupEnd();
	}

	return result;
}

export function logCurrentMemory() {
	const info = getMemoryInfo();
	if (!info) {
		console.log("[Memory] API not available");
		return;
	}

	console.log(
		`%c[Memory] Used: ${formatBytes(info.usedJSHeapSize)} | Total: ${formatBytes(info.totalJSHeapSize)} | Limit: ${formatBytes(info.jsHeapSizeLimit)}`,
		"color: #4CAF50; font-weight: bold;",
	);
}
