import type { ApproveAgentParameters, ApproveAgentSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type ApproveAgentData = ApproveAgentSuccessResponse;
type ApproveAgentParams = ApproveAgentParameters;

export type UseExchangeApproveAgentOptions = MutationParameter<ApproveAgentData, ApproveAgentParams>;
export type UseExchangeApproveAgentReturnType = UseMutationResult<
	ApproveAgentData,
	HyperliquidQueryError,
	ApproveAgentParams
>;

export function getApproveAgentMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ApproveAgentData, ApproveAgentParams> {
	return {
		mutationKey: createMutationKey("approveAgent"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.approveAgent(params)),
	};
}

export function useExchangeApproveAgent(
	options: UseExchangeApproveAgentOptions = {},
): UseExchangeApproveAgentReturnType {
	const { user } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getApproveAgentMutationOptions(user)));
}
