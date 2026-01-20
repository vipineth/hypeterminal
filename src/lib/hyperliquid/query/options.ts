import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import type { HyperliquidQueryError, QueryParameter } from "../types";

/**
 * Computes whether a query should be enabled based on required params and user options.
 * Mirrors wagmi's balance hook pattern for consistent enabled gating.
 *
 * Only considers boolean enabled values - function-based enabled is passed through
 * and handled by TanStack Query directly.
 *
 * @param requiredParams - Boolean indicating if all required params are present
 * @param query - User-provided query options that may include an enabled flag
 * @returns true if the query should run, false otherwise
 */
export function computeEnabled<TOptions extends { enabled?: boolean | unknown }>(
	requiredParams: boolean,
	query?: TOptions,
): boolean {
	const userEnabled = query?.enabled;
	if (typeof userEnabled === "boolean") {
		return requiredParams && userEnabled;
	}
	return requiredParams;
}

/**
 * Type for query options returned by factory functions.
 * Contains only queryKey and queryFn - no refetch controls.
 */
export interface QueryOptions<TQueryFnData> {
	queryKey: QueryKey;
	queryFn: (context: { signal: AbortSignal }) => Promise<TQueryFnData>;
}

/**
 * Merges user-provided query options with factory-generated options.
 * User options (enabled, refetchInterval, staleTime, etc.) are preserved.
 * Factory options (queryKey, queryFn) take precedence to ensure correctness.
 *
 * @param userOptions - User-provided TanStack Query options
 * @param factoryOptions - Factory-generated queryKey and queryFn
 * @param enabled - Computed enabled state from computeEnabled
 * @returns Merged options ready for useQuery
 */
export function mergeQueryOptions<TQueryFnData, TData = TQueryFnData>(
	userOptions: QueryParameter<TQueryFnData, TData>,
	factoryOptions: QueryOptions<TQueryFnData>,
	enabled: boolean,
): UseQueryOptions<TQueryFnData, HyperliquidQueryError, TData, QueryKey> {
	return {
		...userOptions,
		...factoryOptions,
		enabled,
	};
}

/**
 * Creates a standardized query options object.
 * Use this to build consistent query factories for all info hooks.
 *
 * @param queryKey - The query key array
 * @param queryFn - The async function that fetches data
 * @returns QueryOptions object with queryKey and queryFn
 */
export function createQueryOptions<TQueryFnData>(
	queryKey: QueryKey,
	queryFn: (context: { signal: AbortSignal }) => Promise<TQueryFnData>,
): QueryOptions<TQueryFnData> {
	return { queryKey, queryFn };
}
