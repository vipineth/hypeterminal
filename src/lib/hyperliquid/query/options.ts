import type { QueryKey } from "@tanstack/react-query";

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
