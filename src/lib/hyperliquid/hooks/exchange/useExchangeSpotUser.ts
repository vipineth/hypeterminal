import type { SpotUserParameters, SpotUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotUserData = SpotUserSuccessResponse;
type SpotUserParams = SpotUserParameters;

export type UseExchangeSpotUserOptions = MutationParameter<SpotUserData, SpotUserParams>;
export type UseExchangeSpotUserReturnType = UseMutationResult<SpotUserData, HyperliquidQueryError, SpotUserParams>;

export function useExchangeSpotUser(options: UseExchangeSpotUserOptions = {}): UseExchangeSpotUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("spotUser"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.spotUser(params);
		},
	});
}
