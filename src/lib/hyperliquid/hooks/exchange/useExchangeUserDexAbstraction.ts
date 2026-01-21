import type {
	ExchangeClient,
	UserDexAbstractionParameters,
	UserDexAbstractionSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type UserDexAbstractionData = UserDexAbstractionSuccessResponse;
type UserDexAbstractionParams = UserDexAbstractionParameters;

export type UseExchangeUserDexAbstractionOptions = MutationParameter<UserDexAbstractionData, UserDexAbstractionParams>;
export type UseExchangeUserDexAbstractionReturnType = UseMutationResult<
	UserDexAbstractionData,
	HyperliquidQueryError,
	UserDexAbstractionParams
>;

export function getUserDexAbstractionMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<UserDexAbstractionData, UserDexAbstractionParams> {
	return {
		mutationKey: createMutationKey("userDexAbstraction"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.userDexAbstraction(params)),
	};
}

export function useExchangeUserDexAbstraction(
	options: UseExchangeUserDexAbstractionOptions = {},
): UseExchangeUserDexAbstractionReturnType {
	const { admin } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUserDexAbstractionMutationOptions(admin)));
}
