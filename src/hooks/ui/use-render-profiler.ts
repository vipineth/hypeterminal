import { type ProfilerOnRenderCallback } from "react";

export interface RenderMetrics {
  component: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

type MetricsStore = {
  metrics: RenderMetrics[];
  byComponent: Map<string, RenderMetrics[]>;
};

const store: MetricsStore = {
  metrics: [],
  byComponent: new Map(),
};

/**
 * React Profiler callback for benchmarking component render performance.
 *
 * Usage:
 * ```tsx
 * import { Profiler } from 'react';
 * import { onRenderCallback } from '@/hooks/ui/use-render-profiler';
 *
 * <Profiler id="OrderEntryPanel" onRender={onRenderCallback}>
 *   <OrderEntryPanel />
 * </Profiler>
 * ```
 */
export const onRenderCallback: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  const metrics: RenderMetrics = {
    component: id,
    phase: phase as RenderMetrics["phase"],
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  };

  store.metrics.push(metrics);

  if (!store.byComponent.has(id)) {
    store.byComponent.set(id, []);
  }
  store.byComponent.get(id)!.push(metrics);

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Profiler] ${id} (${phase}): ${actualDuration.toFixed(2)}ms actual, ${baseDuration.toFixed(2)}ms base`
    );
  }
};

/**
 * Get all collected metrics
 */
export function getAllMetrics(): RenderMetrics[] {
  return [...store.metrics];
}

/**
 * Get metrics for a specific component
 */
export function getComponentMetrics(componentId: string): RenderMetrics[] {
  return store.byComponent.get(componentId) ?? [];
}

/**
 * Get summary statistics for a component
 */
export function getComponentSummary(componentId: string) {
  const metrics = getComponentMetrics(componentId);
  if (metrics.length === 0) return null;

  const actualDurations = metrics.map((m) => m.actualDuration);
  const baseDurations = metrics.map((m) => m.baseDuration);

  return {
    component: componentId,
    renderCount: metrics.length,
    mountCount: metrics.filter((m) => m.phase === "mount").length,
    updateCount: metrics.filter((m) => m.phase === "update").length,
    actualDuration: {
      avg: avg(actualDurations),
      min: Math.min(...actualDurations),
      max: Math.max(...actualDurations),
      total: sum(actualDurations),
    },
    baseDuration: {
      avg: avg(baseDurations),
      min: Math.min(...baseDurations),
      max: Math.max(...baseDurations),
      total: sum(baseDurations),
    },
  };
}

/**
 * Get summary for all profiled components
 */
export function getAllSummaries() {
  const summaries: ReturnType<typeof getComponentSummary>[] = [];
  for (const componentId of store.byComponent.keys()) {
    const summary = getComponentSummary(componentId);
    if (summary) summaries.push(summary);
  }
  return summaries.sort((a, b) => (b?.actualDuration.total ?? 0) - (a?.actualDuration.total ?? 0));
}

/**
 * Clear all collected metrics
 */
export function clearMetrics(): void {
  store.metrics = [];
  store.byComponent.clear();
}

/**
 * Export metrics as JSON for analysis
 */
export function exportMetrics(): string {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalRenders: store.metrics.length,
      summaries: getAllSummaries(),
      rawMetrics: store.metrics,
    },
    null,
    2
  );
}

/**
 * Log a comparison report to console
 */
export function logReport(): void {
  console.group("React Render Performance Report");
  console.log(`Total renders: ${store.metrics.length}`);
  console.log("---");

  for (const summary of getAllSummaries()) {
    if (!summary) continue;
    console.group(summary.component);
    console.log(`Renders: ${summary.renderCount} (${summary.mountCount} mounts, ${summary.updateCount} updates)`);
    console.log(
      `Actual: avg=${summary.actualDuration.avg.toFixed(2)}ms, max=${summary.actualDuration.max.toFixed(2)}ms, total=${summary.actualDuration.total.toFixed(2)}ms`
    );
    console.log(
      `Base: avg=${summary.baseDuration.avg.toFixed(2)}ms, max=${summary.baseDuration.max.toFixed(2)}ms`
    );
    console.groupEnd();
  }

  console.groupEnd();
}

// Utility functions
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
  return arr.length > 0 ? sum(arr) / arr.length : 0;
}

// Expose to window for easy access in dev tools
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as Record<string, unknown>).__REACT_PROFILER__ = {
    getAllMetrics,
    getComponentMetrics,
    getComponentSummary,
    getAllSummaries,
    clearMetrics,
    exportMetrics,
    logReport,
  };
}
