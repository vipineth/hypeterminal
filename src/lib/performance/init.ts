import { clearLeakData, enableLeakDetector, getLeakedComponents, reportLeaks } from "./leak-detector";
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
	leaks: {
		enable: () => void;
		report: () => void;
		get: () => ReturnType<typeof getLeakedComponents>;
		clear: () => void;
	};
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
			leaks: {
				enable: enableLeakDetector,
				report: reportLeaks,
				get: getLeakedComponents,
				clear: clearLeakData,
			},
		};
		console.log(
			"%c[Performance] Dev tools available: window.perf.vitals(), .renders(), .memory(), .network(), .snapshot(), .leaks.enable()",
			"color: #888; font-style: italic;",
		);
	}
}
