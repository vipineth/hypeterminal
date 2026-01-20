import type {
	ExchangeClient,
	UserDexAbstractionParameters,
	UserDexAbstractionSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.userDexAbstraction(params);
		},
	};
}

export function useExchangeUserDexAbstraction(
	options: UseExchangeUserDexAbstractionOptions = {},
): UseExchangeUserDexAbstractionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getUserDexAbstractionMutationOptions(exchange)));
}
