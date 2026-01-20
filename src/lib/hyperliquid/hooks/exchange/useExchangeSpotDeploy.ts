import type { ExchangeClient, SpotDeployParameters, SpotDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotDeployData = SpotDeploySuccessResponse;
type SpotDeployParams = SpotDeployParameters;

export type UseExchangeSpotDeployOptions = MutationParameter<SpotDeployData, SpotDeployParams>;
export type UseExchangeSpotDeployReturnType = UseMutationResult<
	SpotDeployData,
	HyperliquidQueryError,
	SpotDeployParams
>;

export function getSpotDeployMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SpotDeployData, SpotDeployParams> {
	return {
		mutationKey: createMutationKey("spotDeploy"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.spotDeploy(params);
		},
	};
}

export function useExchangeSpotDeploy(options: UseExchangeSpotDeployOptions = {}): UseExchangeSpotDeployReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotDeployMutationOptions(exchange)));
}
