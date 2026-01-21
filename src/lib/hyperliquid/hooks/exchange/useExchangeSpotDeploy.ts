import type { ExchangeClient, SpotDeployParameters, SpotDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.spotDeploy(params)),
	};
}

export function useExchangeSpotDeploy(options: UseExchangeSpotDeployOptions = {}): UseExchangeSpotDeployReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotDeployMutationOptions(trading)));
}
