import { lazyRouteComponent } from "@tanstack/react-router";

/**
 * Lazy-loaded component with preloading support. Uses TanStack Router's
 * lazyRouteComponent which defers evaluation on the server too — `React.lazy()`
 * does NOT (Vite's SSR runner walks the full import chain), so prefer this
 * helper for SSR-unsafe modules.
 *
 * Adds `.preload()` for hover prefetch, recovers from stale-build module-not-
 * found errors, and uses React 19's `React.use()` under the hood.
 *
 * @example
 * const Chart = createLazyComponent(() => import("./chart"), "Chart");
 * <button onMouseEnter={() => Chart.preload()}>Show Chart</button>
 */
export function createLazyComponent<T extends Record<string, unknown>, K extends keyof T>(
	importer: () => Promise<T>,
	exportName: K,
) {
	return lazyRouteComponent(importer, exportName);
}

/**
 * Creates a lazy-loaded component that uses the default export.
 *
 * @example
 * const Modal = createLazyDefault(() => import("./modal"));
 */
export function createLazyDefault<T extends { default: React.ComponentType<unknown> }>(importer: () => Promise<T>) {
	return lazyRouteComponent(importer, "default");
}
