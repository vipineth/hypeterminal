import type { ApproveAgentParameters, ApproveAgentSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ApproveAgentData = ApproveAgentSuccessResponse;
type ApproveAgentParams = ApproveAgentParameters;

export type UseExchangeApproveAgentOptions = MutationParameter<ApproveAgentData, ApproveAgentParams>;
export type UseExchangeApproveAgentReturnType = UseMutationResult<
	ApproveAgentData,
	HyperliquidQueryError,
	ApproveAgentParams
>;

export function useExchangeApproveAgent(
	options: UseExchangeApproveAgentOptions = {},
): UseExchangeApproveAgentReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("approveAgent"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.approveAgent(params);
		},
	});
}
