type RenderEntry = {
	componentName: string;
	phase: "mount" | "update";
	actualDuration: number;
	baseDuration: number;
	startTime: number;
	commitTime: number;
};

const renderLog: RenderEntry[] = [];
const SLOW_RENDER_THRESHOLD_MS = 16; // ~60fps

export function logRender(
	id: string,
	phase: "mount" | "update",
	actualDuration: number,
	baseDuration: number,
	startTime: number,
	commitTime: number,
) {
	const entry: RenderEntry = {
		componentName: id,
		phase,
		actualDuration,
		baseDuration,
		startTime,
		commitTime,
	};

	renderLog.push(entry);

	if (import.meta.env.DEV && actualDuration > SLOW_RENDER_THRESHOLD_MS) {
		console.warn(
			`%c[Slow Render] ${id} (${phase}): ${actualDuration.toFixed(2)}ms`,
			"color: orange; font-weight: bold;",
		);
	}
}

export function getRenderLog(): RenderEntry[] {
	return [...renderLog];
}

export function clearRenderLog() {
	renderLog.length = 0;
}

export function analyzeRenders() {
	if (renderLog.length === 0) {
		console.log("[Render Tracker] No renders logged");
		return;
	}

	const byComponent = renderLog.reduce(
		(acc, entry) => {
			if (!acc[entry.componentName]) {
				acc[entry.componentName] = { mounts: 0, updates: 0, totalDuration: 0, renders: [] };
			}
			acc[entry.componentName].renders.push(entry);
			acc[entry.componentName].totalDuration += entry.actualDuration;
			if (entry.phase === "mount") {
				acc[entry.componentName].mounts++;
			} else {
				acc[entry.componentName].updates++;
			}
			return acc;
		},
		{} as Record<string, { mounts: number; updates: number; totalDuration: number; renders: RenderEntry[] }>,
	);

	const sorted = Object.entries(byComponent).sort((a, b) => b[1].totalDuration - a[1].totalDuration);

	console.group("[Render Tracker] Analysis");
	console.log(`Total renders logged: ${renderLog.length}`);
	console.log("\nTop components by total render time:");

	sorted.slice(0, 10).forEach(([name, data], i) => {
		const avgDuration = data.totalDuration / data.renders.length;
		console.log(
			`${i + 1}. ${name}: ${data.totalDuration.toFixed(2)}ms total, ${data.renders.length} renders (${data.mounts} mounts, ${data.updates} updates), avg: ${avgDuration.toFixed(2)}ms`,
		);
	});

	const slowRenders = renderLog.filter((r) => r.actualDuration > SLOW_RENDER_THRESHOLD_MS);
	if (slowRenders.length > 0) {
		console.log(`\nSlow renders (>${SLOW_RENDER_THRESHOLD_MS}ms): ${slowRenders.length}`);
	}

	console.groupEnd();
}

export function getSlowRenders(thresholdMs = SLOW_RENDER_THRESHOLD_MS): RenderEntry[] {
	return renderLog.filter((r) => r.actualDuration > thresholdMs);
}

export function getComponentRenderCount(componentName: string): number {
	return renderLog.filter((r) => r.componentName === componentName).length;
}
