import { analyzeMemoryTrend, logCurrentMemory, startMemoryMonitoring, takeMemorySnapshot } from "./memory";
import { analyzeNetworkPerformance } from "./network";
import { analyzeRenders } from "./render-tracker";
import { initWebVitals, reportMetricsSummary } from "./web-vitals";

interface PerformanceAPI {
	vitals: () => void;
	renders: () => void;
	memory: () => unknown;
	network: () => void;
	snapshot: () => unknown;
}

declare global {
	interface Window {
		perf?: PerformanceAPI;
	}
}

export function initPerformanceMonitoring() {
	if (typeof window === "undefined") return;

	initWebVitals();

	if (import.meta.env.DEV) {
		logCurrentMemory();
		startMemoryMonitoring(30000);

		window.perf = {
			vitals: reportMetricsSummary,
			renders: analyzeRenders,
			memory: analyzeMemoryTrend,
			network: analyzeNetworkPerformance,
			snapshot: takeMemorySnapshot,
		};
		console.log(
			"%c[Performance] Dev tools available: window.perf.vitals(), .renders(), .memory(), .network(), .snapshot()",
			"color: #888; font-style: italic;",
		);
	}
}
