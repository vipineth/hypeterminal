import type { Metric } from "web-vitals";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

type MetricRating = "good" | "needs-improvement" | "poor";

interface MetricThresholds {
	good: number;
	needsImprovement: number;
}

const THRESHOLDS: Record<string, MetricThresholds> = {
	LCP: { good: 2500, needsImprovement: 4000 },
	INP: { good: 200, needsImprovement: 500 },
	CLS: { good: 0.1, needsImprovement: 0.25 },
	FCP: { good: 1800, needsImprovement: 3000 },
	TTFB: { good: 800, needsImprovement: 1800 },
};

function getRating(name: string, value: number): MetricRating {
	const threshold = THRESHOLDS[name];
	if (!threshold) return "good";
	if (value <= threshold.good) return "good";
	if (value <= threshold.needsImprovement) return "needs-improvement";
	return "poor";
}

function formatValue(name: string, value: number): string {
	if (name === "CLS") return value.toFixed(3);
	return `${Math.round(value)}ms`;
}

function getConsoleColor(rating: MetricRating): string {
	if (rating === "good") return "green";
	if (rating === "needs-improvement") return "orange";
	return "red";
}

function logMetric(metric: Metric) {
	const rating = getRating(metric.name, metric.value);
	const color = getConsoleColor(rating);
	const formattedValue = formatValue(metric.name, metric.value);

	console.log(`%c[Web Vitals] ${metric.name}: ${formattedValue} (${rating})`, `color: ${color}; font-weight: bold;`);

	const attribution = (metric as Metric & { attribution?: unknown }).attribution;
	if (attribution) {
		console.log(`  Attribution:`, attribution);
	}
}

interface VitalsData {
	name: string;
	value: number;
	rating: MetricRating;
	delta: number;
	id: string;
	attribution?: unknown;
}

type VitalsCallback = (data: VitalsData) => void;

let collectedMetrics: VitalsData[] = [];
const MAX_COLLECTED_METRICS = 100;

function createMetricHandler(callback?: VitalsCallback) {
	return (metric: Metric) => {
		const rating = getRating(metric.name, metric.value);
		const data: VitalsData = {
			name: metric.name,
			value: metric.value,
			rating,
			delta: metric.delta,
			id: metric.id,
			attribution: (metric as Metric & { attribution?: unknown }).attribution,
		};

		if (collectedMetrics.length >= MAX_COLLECTED_METRICS) {
			collectedMetrics.shift();
		}
		collectedMetrics.push(data);

		if (import.meta.env.DEV) {
			logMetric(metric);
		}

		callback?.(data);
	};
}

export type VitalsReporter = (metrics: VitalsData[]) => void;

let productionReporter: VitalsReporter | null = null;

export function setProductionReporter(reporter: VitalsReporter) {
	productionReporter = reporter;
}

function reportToProduction(data: VitalsData) {
	if (productionReporter && !import.meta.env.DEV) {
		productionReporter([data]);
	}
}

export function initWebVitals(callback?: VitalsCallback) {
	const handler = createMetricHandler((data) => {
		callback?.(data);
		reportToProduction(data);
	});

	onLCP(handler);
	onINP(handler);
	onCLS(handler);
	onFCP(handler);
	onTTFB(handler);

	if (import.meta.env.DEV) {
		console.log(
			"%c[Web Vitals] Monitoring initialized. Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1",
			"color: #888; font-style: italic;",
		);
	}
}

export function getCollectedMetrics(): VitalsData[] {
	return [...collectedMetrics];
}

export function clearMetrics() {
	collectedMetrics = [];
}

export function reportMetricsSummary() {
	if (!import.meta.env.DEV) return;

	if (collectedMetrics.length === 0) {
		console.log("[Web Vitals] No metrics collected yet");
		return;
	}

	console.group("[Web Vitals] Summary");
	const grouped = collectedMetrics.reduce(
		(acc, m) => {
			if (!acc[m.name]) acc[m.name] = [];
			acc[m.name].push(m);
			return acc;
		},
		{} as Record<string, VitalsData[]>,
	);

	for (const [name, metrics] of Object.entries(grouped)) {
		const latest = metrics[metrics.length - 1];
		const rating = latest.rating;
		const color = rating === "good" ? "green" : rating === "needs-improvement" ? "orange" : "red";
		console.log(`%c${name}: ${formatValue(name, latest.value)} (${rating})`, `color: ${color}; font-weight: bold;`);
	}
	console.groupEnd();
}
