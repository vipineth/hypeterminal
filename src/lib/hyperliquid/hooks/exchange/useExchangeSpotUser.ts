import type { ExchangeClient, SpotUserParameters, SpotUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotUserData = SpotUserSuccessResponse;
type SpotUserParams = SpotUserParameters;

export type UseExchangeSpotUserOptions = MutationParameter<SpotUserData, SpotUserParams>;
export type UseExchangeSpotUserReturnType = UseMutationResult<SpotUserData, HyperliquidQueryError, SpotUserParams>;

export function getSpotUserMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SpotUserData, SpotUserParams> {
	return {
		mutationKey: createMutationKey("spotUser"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.spotUser(params)),
	};
}

export function useExchangeSpotUser(options: UseExchangeSpotUserOptions = {}): UseExchangeSpotUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotUserMutationOptions(exchange)));
}
