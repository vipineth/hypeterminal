import { lazyRouteComponent } from "@tanstack/react-router";

/**
 * Creates a lazy-loaded component with preloading support.
 * Uses TanStack Router's lazyRouteComponent for better integration with the framework.
 *
 * Benefits over React.lazy():
 * - `.preload()` method for prefetching on hover/intent
 * - Auto-reload on stale builds (module not found recovery)
 * - Uses React 19's React.use() for suspense
 *
 * @example
 * const Chart = createLazyComponent(() => import("./chart"), "Chart");
 * // Preload on hover
 * <button onMouseEnter={() => Chart.preload()}>Show Chart</button>
 */
export function createLazyComponent<T extends Record<string, any>, K extends keyof T>(
	importer: () => Promise<T>,
	exportName: K,
) {
	return lazyRouteComponent(importer, exportName);
}
