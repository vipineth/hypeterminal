import {
	Activity,
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Gauge,
	MemoryStick,
	Minus,
	Network,
	RefreshCw,
	X,
} from "lucide-react";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
	clearLeakData,
	disableLeakDetector,
	enableLeakDetector,
	getLeakedComponents,
} from "@/lib/performance/leak-detector";
import {
	analyzeMemoryTrend,
	getMemorySnapshots,
	startMemoryMonitoring,
	stopMemoryMonitoring,
} from "@/lib/performance/memory";
import { analyzeNetworkPerformance, getResourceEntries } from "@/lib/performance/network";
import { clearRenderLog, getRenderLog, getSlowRenders } from "@/lib/performance/render-tracker";
import { getCollectedMetrics, reportMetricsSummary } from "@/lib/performance/web-vitals";

type MetricRating = "good" | "needs-improvement" | "poor";

interface VitalsData {
	name: string;
	value: number;
	rating: MetricRating;
}

interface MemoryTrend {
	startHeap: number;
	endHeap: number;
	growth: number;
	growthPerMinute: number;
	potentialLeak: boolean;
}

interface PerfState {
	vitalsEnabled: boolean;
	memoryEnabled: boolean;
	rendersEnabled: boolean;
	networkEnabled: boolean;
	leaksEnabled: boolean;
}

const STORAGE_KEY = "perf-panel-state";

function loadState(): PerfState {
	if (typeof window === "undefined") {
		return {
			vitalsEnabled: true,
			memoryEnabled: false,
			rendersEnabled: false,
			networkEnabled: false,
			leaksEnabled: false,
		};
	}
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) return JSON.parse(saved);
	} catch {
		// ignore
	}
	return {
		vitalsEnabled: true,
		memoryEnabled: false,
		rendersEnabled: false,
		networkEnabled: false,
		leaksEnabled: false,
	};
}

function saveState(state: PerfState) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

function formatBytes(bytes: number): string {
	const mb = bytes / (1024 * 1024);
	return `${mb.toFixed(1)}MB`;
}

function formatValue(name: string, value: number): string {
	if (name === "CLS") return value.toFixed(3);
	return `${Math.round(value)}ms`;
}

function getRatingColor(rating: MetricRating): string {
	if (rating === "good") return "text-positive";
	if (rating === "needs-improvement") return "text-warning";
	return "text-negative";
}

const listeners: Set<() => void> = new Set();
let refreshCounter = 0;

function subscribe(callback: () => void) {
	listeners.add(callback);
	return () => listeners.delete(callback);
}

function getSnapshot() {
	return refreshCounter;
}

function triggerRefresh() {
	refreshCounter++;
	listeners.forEach((l) => {
		l();
	});
}

interface Props {
	onClose?: () => void;
}

export function PerfPanel({ onClose }: Props) {
	const [isMinimized, setIsMinimized] = useState(false);
	const [expandedSection, setExpandedSection] = useState<string | null>("vitals");
	const [state, setState] = useState<PerfState>(loadState);

	useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const updateState = useCallback((updates: Partial<PerfState>) => {
		setState((prev) => {
			const next = { ...prev, ...updates };
			saveState(next);
			return next;
		});
	}, []);

	function handleMemoryToggle(enabled: boolean) {
		if (enabled) {
			startMemoryMonitoring(5000);
		} else {
			stopMemoryMonitoring();
		}
		updateState({ memoryEnabled: enabled });
	}

	function handleLeaksToggle(enabled: boolean) {
		if (enabled) {
			enableLeakDetector();
		} else {
			disableLeakDetector();
		}
		updateState({ leaksEnabled: enabled });
	}

	function handleRefresh() {
		triggerRefresh();
	}

	const vitals = getCollectedMetrics();
	const latestVitals = vitals.reduce(
		(acc, m) => {
			acc[m.name] = m;
			return acc;
		},
		{} as Record<string, VitalsData>,
	);

	const memorySnapshots = getMemorySnapshots();
	const latestMemory = memorySnapshots[memorySnapshots.length - 1];
	const memoryTrend = memorySnapshots.length >= 2 ? (analyzeMemoryTrend() as MemoryTrend | null) : null;

	const renderLog = getRenderLog();
	const slowRenders = getSlowRenders();

	const networkEntries = getResourceEntries();
	const totalNetworkSize = networkEntries.reduce((sum, e) => sum + e.transferSize, 0);

	const leaks = state.leaksEnabled ? getLeakedComponents() : [];

	if (isMinimized) {
		return (
			<div className="fixed bottom-4 right-4 z-9999">
				<Button
					variant="outline"
					size="icon-sm"
					onClick={() => setIsMinimized(false)}
					className="bg-bg/95 backdrop-blur border-border/60 shadow-lg"
				>
					<Activity className="size-4" />
				</Button>
			</div>
		);
	}

	return (
		<div className="fixed bottom-4 right-4 z-9999 w-80 max-h-[80vh] overflow-hidden rounded-lg border border-border/60 bg-orange-50 backdrop-blur shadow-xl">
			<div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
				<div className="flex items-center gap-2">
					<Activity className="size-4 text-info" />
					<span className="text-sm font-medium">Performance</span>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon-sm" onClick={handleRefresh} className="size-6">
						<RefreshCw className="size-3" />
					</Button>
					<Button variant="ghost" size="icon-sm" onClick={() => setIsMinimized(true)} className="size-6">
						<Minus className="size-3" />
					</Button>
					{onClose && (
						<Button variant="ghost" size="icon-sm" onClick={onClose} className="size-6">
							<X className="size-3" />
						</Button>
					)}
				</div>
			</div>

			<div className="overflow-y-auto max-h-[calc(80vh-44px)]">
				<Section
					title="Web Vitals"
					icon={<Gauge className="size-3.5" />}
					enabled={state.vitalsEnabled}
					onToggle={(v) => updateState({ vitalsEnabled: v })}
					expanded={expandedSection === "vitals"}
					onExpand={() => setExpandedSection(expandedSection === "vitals" ? null : "vitals")}
				>
					{Object.keys(latestVitals).length === 0 ? (
						<p className="text-xs text-muted-fg">Waiting for metrics...</p>
					) : (
						<div className="grid grid-cols-2 gap-2">
							{Object.entries(latestVitals).map(([name, data]) => (
								<div key={name} className="flex items-center justify-between">
									<span className="text-xs text-muted-fg">{name}</span>
									<span className={cn("text-xs font-mono", getRatingColor(data.rating))}>
										{formatValue(name, data.value)}
									</span>
								</div>
							))}
						</div>
					)}
					<Button variant="ghost" size="xs" onClick={() => reportMetricsSummary()} className="mt-2 text-muted-fg">
						Log to Console
					</Button>
				</Section>

				<Section
					title="Memory"
					icon={<MemoryStick className="size-3.5" />}
					enabled={state.memoryEnabled}
					onToggle={handleMemoryToggle}
					expanded={expandedSection === "memory"}
					onExpand={() => setExpandedSection(expandedSection === "memory" ? null : "memory")}
				>
					{!latestMemory ? (
						<p className="text-xs text-muted-fg">Enable to start monitoring</p>
					) : (
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-fg">Used Heap</span>
								<span className="text-xs font-mono">{formatBytes(latestMemory.usedJSHeapSize)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-fg">Total Heap</span>
								<span className="text-xs font-mono">{formatBytes(latestMemory.totalJSHeapSize)}</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-fg">Snapshots</span>
								<span className="text-xs font-mono">{memorySnapshots.length}</span>
							</div>
							{memoryTrend && (
								<div className={cn("flex items-center justify-between", memoryTrend.potentialLeak && "text-negative")}>
									<span className="text-xs text-muted-fg">Growth/min</span>
									<span className="text-xs font-mono">{formatBytes(memoryTrend.growthPerMinute)}</span>
								</div>
							)}
						</div>
					)}
				</Section>

				<Section
					title="Renders"
					icon={<Activity className="size-3.5" />}
					enabled={state.rendersEnabled}
					onToggle={(v) => updateState({ rendersEnabled: v })}
					expanded={expandedSection === "renders"}
					onExpand={() => setExpandedSection(expandedSection === "renders" ? null : "renders")}
				>
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-fg">Total Renders</span>
							<span className="text-xs font-mono">{renderLog.length}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-fg">Slow ({">"}16ms)</span>
							<span className={cn("text-xs font-mono", slowRenders.length > 0 && "text-warning")}>
								{slowRenders.length}
							</span>
						</div>
					</div>
					{slowRenders.length > 0 && (
						<div className="mt-2 space-y-0.5">
							<p className="text-2xs text-muted-fg uppercase tracking-wider">Recent Slow:</p>
							{slowRenders.slice(-3).map((r, i) => (
								<div key={`${r.componentName}-${i}`} className="flex items-center justify-between text-2xs">
									<span className="truncate max-w-[140px]">{r.componentName}</span>
									<span className="text-warning font-mono">{r.actualDuration.toFixed(1)}ms</span>
								</div>
							))}
						</div>
					)}
					<Button variant="ghost" size="xs" onClick={() => clearRenderLog()} className="mt-2 text-muted-fg">
						Clear Log
					</Button>
				</Section>

				<Section
					title="Network"
					icon={<Network className="size-3.5" />}
					enabled={state.networkEnabled}
					onToggle={(v) => updateState({ networkEnabled: v })}
					expanded={expandedSection === "network"}
					onExpand={() => setExpandedSection(expandedSection === "network" ? null : "network")}
				>
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-fg">Requests</span>
							<span className="text-xs font-mono">{networkEntries.length}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs text-muted-fg">Total Size</span>
							<span className="text-xs font-mono">{formatBytes(totalNetworkSize)}</span>
						</div>
					</div>
					<Button variant="ghost" size="xs" onClick={() => analyzeNetworkPerformance()} className="mt-2 text-muted-fg">
						Analyze in Console
					</Button>
				</Section>

				<Section
					title="Leak Detector"
					icon={<AlertTriangle className="size-3.5" />}
					enabled={state.leaksEnabled}
					onToggle={handleLeaksToggle}
					expanded={expandedSection === "leaks"}
					onExpand={() => setExpandedSection(expandedSection === "leaks" ? null : "leaks")}
				>
					{!state.leaksEnabled ? (
						<p className="text-xs text-muted-fg">Enable to track component lifecycles</p>
					) : leaks.length === 0 ? (
						<p className="text-xs text-positive">No leaks detected</p>
					) : (
						<div className="space-y-1">
							{leaks.slice(0, 5).map((leak) => (
								<div key={leak.name} className="flex items-center justify-between text-xs">
									<span className="truncate max-w-[160px]">{leak.name}</span>
									<span className="text-negative font-mono">{leak.count}</span>
								</div>
							))}
						</div>
					)}
					{state.leaksEnabled && (
						<Button
							variant="ghost"
							size="xs"
							onClick={() => {
								clearLeakData();
								triggerRefresh();
							}}
							className="mt-2 text-muted-fg"
						>
							Clear Data
						</Button>
					)}
				</Section>
			</div>
		</div>
	);
}

interface SectionProps {
	title: string;
	icon: React.ReactNode;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	expanded: boolean;
	onExpand: () => void;
	children: React.ReactNode;
}

function Section({ title, icon, enabled, onToggle, expanded, onExpand, children }: SectionProps) {
	return (
		<div className="border-b border-border/30 last:border-b-0">
			<div className="flex items-center justify-between px-3 py-2">
				<button type="button" onClick={onExpand} className="flex items-center gap-2 text-sm hover:text-fg/80">
					{icon}
					<span>{title}</span>
					{expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
				</button>
				<Switch checked={enabled} onCheckedChange={onToggle} />
			</div>
			{expanded && enabled && <div className="px-3 pb-3">{children}</div>}
		</div>
	);
}
