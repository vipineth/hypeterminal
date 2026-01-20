import type { ApproveAgentParameters, ApproveAgentSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
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
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getApproveAgentMutationOptions(exchange)));
}
