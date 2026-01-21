import type { ExchangeClient, PerpDeployParameters, PerpDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type PerpDeployData = PerpDeploySuccessResponse;
type PerpDeployParams = PerpDeployParameters;

export type UseExchangePerpDeployOptions = MutationParameter<PerpDeployData, PerpDeployParams>;
export type UseExchangePerpDeployReturnType = UseMutationResult<
	PerpDeployData,
	HyperliquidQueryError,
	PerpDeployParams
>;

export function getPerpDeployMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<PerpDeployData, PerpDeployParams> {
	return {
		mutationKey: createMutationKey("perpDeploy"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.perpDeploy(params)),
	};
}

export function useExchangePerpDeploy(options: UseExchangePerpDeployOptions = {}): UseExchangePerpDeployReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getPerpDeployMutationOptions(trading)));
}
