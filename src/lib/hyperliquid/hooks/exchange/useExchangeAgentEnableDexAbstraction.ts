import type { AgentEnableDexAbstractionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type AgentEnableDexAbstractionData = AgentEnableDexAbstractionSuccessResponse;

export type UseExchangeAgentEnableDexAbstractionOptions = MutationParameter<AgentEnableDexAbstractionData, void>;
export type UseExchangeAgentEnableDexAbstractionReturnType = UseMutationResult<
	AgentEnableDexAbstractionData,
	HyperliquidQueryError,
	void
>;

export function getAgentEnableDexAbstractionMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<AgentEnableDexAbstractionData, void> {
	return {
		mutationKey: createMutationKey("agentEnableDexAbstraction"),
		mutationFn: guardedMutationFn(exchange, (ex) => ex.agentEnableDexAbstraction()),
	};
}

export function useExchangeAgentEnableDexAbstraction(
	options: UseExchangeAgentEnableDexAbstractionOptions = {},
): UseExchangeAgentEnableDexAbstractionReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getAgentEnableDexAbstractionMutationOptions(trading)));
}
