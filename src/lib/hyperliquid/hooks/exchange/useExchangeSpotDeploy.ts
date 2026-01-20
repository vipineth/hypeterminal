import type { ExchangeClient, SpotDeployParameters, SpotDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
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

interface SpotDeployMutationContext {
	exchange: ExchangeClient | null;
}

export function getSpotDeployMutationOptions(
	context: SpotDeployMutationContext,
): MutationOptions<SpotDeployData, SpotDeployParams> {
	return {
		mutationKey: createMutationKey("spotDeploy"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.spotDeploy(params);
		},
	};
}

export function useExchangeSpotDeploy(options: UseExchangeSpotDeployOptions = {}): UseExchangeSpotDeployReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSpotDeployMutationOptions({ exchange })));
}
