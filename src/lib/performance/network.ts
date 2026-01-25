interface NetworkEntry {
	name: string;
	type: string;
	duration: number;
	transferSize: number;
	startTime: number;
	responseStart: number;
	responseEnd: number;
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function getPathname(url: string): string {
	try {
		return new URL(url).pathname;
	} catch {
		return url;
	}
}

export function getResourceEntries(): NetworkEntry[] {
	const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
	return entries.map((e) => ({
		name: e.name,
		type: e.initiatorType,
		duration: e.duration,
		transferSize: e.transferSize,
		startTime: e.startTime,
		responseStart: e.responseStart,
		responseEnd: e.responseEnd,
	}));
}

export function analyzeNetworkPerformance() {
	if (!import.meta.env.DEV) return;

	const entries = getResourceEntries();

	if (entries.length === 0) {
		console.log("[Network] No resource entries found");
		return;
	}

	const byType = entries.reduce(
		(acc, e) => {
			if (!acc[e.type]) acc[e.type] = [];
			acc[e.type].push(e);
			return acc;
		},
		{} as Record<string, NetworkEntry[]>,
	);

	console.group("[Network] Resource Analysis");

	for (const [type, resources] of Object.entries(byType)) {
		const totalSize = resources.reduce((sum, r) => sum + r.transferSize, 0);
		const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
		const avgDuration = totalDuration / resources.length;

		console.log(
			`${type}: ${resources.length} requests, ${formatSize(totalSize)} total, ${formatDuration(avgDuration)} avg`,
		);
	}

	const totalSize = entries.reduce((sum, e) => sum + e.transferSize, 0);
	console.log(`\nTotal: ${entries.length} requests, ${formatSize(totalSize)}`);

	const slowest = [...entries].sort((a, b) => b.duration - a.duration).slice(0, 5);
	if (slowest.length > 0) {
		console.log("\nSlowest resources:");
		slowest.forEach((r, i) => {
			console.log(`  ${i + 1}. ${getPathname(r.name)}: ${formatDuration(r.duration)}`);
		});
	}

	const largest = [...entries].sort((a, b) => b.transferSize - a.transferSize).slice(0, 5);
	if (largest.length > 0) {
		console.log("\nLargest resources:");
		largest.forEach((r, i) => {
			console.log(`  ${i + 1}. ${getPathname(r.name)}: ${formatSize(r.transferSize)}`);
		});
	}

	console.groupEnd();
}

interface WebSocketMetrics {
	messagesReceived: number;
	messagesSent: number;
	bytesReceived: number;
	bytesSent: number;
	startTime: number;
	messageFrequency: number[];
}

const wsMetrics: Map<string, WebSocketMetrics> = new Map();
const trackedSockets = new WeakSet<WebSocket>();

export function trackWebSocket(ws: WebSocket, label: string) {
	if (trackedSockets.has(ws)) {
		return wsMetrics.get(label);
	}
	trackedSockets.add(ws);

	const metrics: WebSocketMetrics = {
		messagesReceived: 0,
		messagesSent: 0,
		bytesReceived: 0,
		bytesSent: 0,
		startTime: Date.now(),
		messageFrequency: [],
	};

	wsMetrics.set(label, metrics);

	const originalOnMessage = ws.onmessage;
	ws.onmessage = (event) => {
		metrics.messagesReceived++;
		if (typeof event.data === "string") {
			metrics.bytesReceived += event.data.length;
		} else if (event.data instanceof ArrayBuffer) {
			metrics.bytesReceived += event.data.byteLength;
		} else if (event.data instanceof Blob) {
			metrics.bytesReceived += event.data.size;
		}
		metrics.messageFrequency.push(Date.now());

		if (metrics.messageFrequency.length > 100) {
			metrics.messageFrequency.shift();
		}

		originalOnMessage?.call(ws, event);
	};

	const originalSend = ws.send.bind(ws);
	ws.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
		metrics.messagesSent++;
		if (typeof data === "string") {
			metrics.bytesSent += data.length;
		} else if (data instanceof ArrayBuffer) {
			metrics.bytesSent += data.byteLength;
		}
		originalSend(data);
	};

	return metrics;
}

export function getWebSocketMetrics(label: string): WebSocketMetrics | undefined {
	return wsMetrics.get(label);
}

export function analyzeWebSocketMetrics(label: string) {
	if (!import.meta.env.DEV) return;

	const metrics = wsMetrics.get(label);
	if (!metrics) {
		console.log(`[WebSocket] No metrics found for "${label}"`);
		return;
	}

	const duration = (Date.now() - metrics.startTime) / 1000;
	const messagesPerSecond = metrics.messagesReceived / duration;

	let recentMsgPerSecond = 0;
	if (metrics.messageFrequency.length >= 2) {
		const recentWindow = metrics.messageFrequency.slice(-10);
		const windowDuration = (recentWindow[recentWindow.length - 1] - recentWindow[0]) / 1000;
		if (windowDuration > 0) {
			recentMsgPerSecond = recentWindow.length / windowDuration;
		}
	}

	console.group(`[WebSocket] Metrics for "${label}"`);
	console.log(`Duration: ${duration.toFixed(1)}s`);
	console.log(`Messages received: ${metrics.messagesReceived}`);
	console.log(`Messages sent: ${metrics.messagesSent}`);
	console.log(`Bytes received: ${formatSize(metrics.bytesReceived)}`);
	console.log(`Bytes sent: ${formatSize(metrics.bytesSent)}`);
	console.log(`Avg messages/sec: ${messagesPerSecond.toFixed(2)}`);
	console.log(`Recent messages/sec: ${recentMsgPerSecond.toFixed(2)}`);

	if (messagesPerSecond > 50) {
		console.warn("%cHigh message frequency! Consider batching.", "color: orange;");
	}

	console.groupEnd();
}
