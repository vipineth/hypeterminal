import type { SpotDeployParameters, SpotDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeSpotDeploy(options: UseExchangeSpotDeployOptions = {}): UseExchangeSpotDeployReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("spotDeploy"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.spotDeploy(params);
		},
	});
}
