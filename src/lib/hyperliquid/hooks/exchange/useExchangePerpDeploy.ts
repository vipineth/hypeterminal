import type { PerpDeployParameters, PerpDeploySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type PerpDeployData = PerpDeploySuccessResponse;
type PerpDeployParams = PerpDeployParameters;

export type UseExchangePerpDeployOptions = MutationParameter<PerpDeployData, PerpDeployParams>;
export type UseExchangePerpDeployReturnType = UseMutationResult<
	PerpDeployData,
	HyperliquidQueryError,
	PerpDeployParams
>;

export function useExchangePerpDeploy(options: UseExchangePerpDeployOptions = {}): UseExchangePerpDeployReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("perpDeploy"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.perpDeploy(params);
		},
	});
}
