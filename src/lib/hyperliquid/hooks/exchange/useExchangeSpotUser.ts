import type { ExchangeClient, SpotUserParameters, SpotUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotUserData = SpotUserSuccessResponse;
type SpotUserParams = SpotUserParameters;

export type UseExchangeSpotUserOptions = MutationParameter<SpotUserData, SpotUserParams>;
export type UseExchangeSpotUserReturnType = UseMutationResult<SpotUserData, HyperliquidQueryError, SpotUserParams>;

interface SpotUserMutationContext {
	exchange: ExchangeClient | null;
}

export function getSpotUserMutationOptions(
	context: SpotUserMutationContext,
): MutationOptions<SpotUserData, SpotUserParams> {
	return {
		mutationKey: createMutationKey("spotUser"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.spotUser(params);
		},
	};
}

export function useExchangeSpotUser(options: UseExchangeSpotUserOptions = {}): UseExchangeSpotUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotUserMutationOptions({ exchange })));
}
