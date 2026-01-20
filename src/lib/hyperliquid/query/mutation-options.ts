import type { UseMutationOptions } from "@tanstack/react-query";
import type { HyperliquidQueryError, MutationParameter } from "../types";

/**
 * Type for mutation options returned by factory functions.
 * Contains mutationKey and mutationFn - the core mutation definition.
 */
export interface MutationOptions<TData, TVariables> {
	mutationKey: readonly unknown[];
	mutationFn: (variables: TVariables) => Promise<TData>;
}

/**
 * Merges user-provided mutation options with factory-generated options.
 * User callbacks (onSuccess, onError, etc.) are preserved.
 * Factory options (mutationKey, mutationFn) take precedence.
 *
 * @param userOptions - User-provided TanStack Mutation options
 * @param factoryOptions - Factory-generated mutationKey and mutationFn
 * @returns Merged options ready for useMutation
 */
export function mergeMutationOptions<TData, TVariables>(
	userOptions: MutationParameter<TData, TVariables>,
	factoryOptions: MutationOptions<TData, TVariables>,
): UseMutationOptions<TData, HyperliquidQueryError, TVariables> {
	return {
		...userOptions,
		...factoryOptions,
	};
}

/**
 * Creates a standardized mutation key with the 'hl' prefix.
 * Optionally includes clientKey for per-user cache isolation.
 *
 * @param action - The action name (e.g., 'order', 'cancel')
 * @param clientKey - Optional client key for cache isolation (usually wallet address)
 * @returns Readonly mutation key array
 */
export function createMutationKey(action: string, clientKey?: string): readonly unknown[] {
	if (clientKey) {
		return ["hl", action, clientKey] as const;
	}
	return ["hl", action] as const;
}

/**
 * Creates a standardized mutation options object.
 * Use this to build consistent mutation factories for all exchange hooks.
 *
 * @param mutationKey - The mutation key array
 * @param mutationFn - The async function that performs the mutation
 * @returns MutationOptions object with mutationKey and mutationFn
 */
export function createMutationOptions<TData, TVariables>(
	mutationKey: readonly unknown[],
	mutationFn: (variables: TVariables) => Promise<TData>,
): MutationOptions<TData, TVariables> {
	return { mutationKey, mutationFn };
}
