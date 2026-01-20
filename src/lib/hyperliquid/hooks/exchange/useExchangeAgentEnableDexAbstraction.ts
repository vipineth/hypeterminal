import type { AgentEnableDexAbstractionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type AgentEnableDexAbstractionData = AgentEnableDexAbstractionSuccessResponse;

export type UseExchangeAgentEnableDexAbstractionOptions = MutationParameter<AgentEnableDexAbstractionData, void>;
export type UseExchangeAgentEnableDexAbstractionReturnType = UseMutationResult<
	AgentEnableDexAbstractionData,
	HyperliquidQueryError,
	void
>;

interface AgentEnableDexAbstractionMutationContext {
	exchange: ExchangeClient | null;
}

export function getAgentEnableDexAbstractionMutationOptions(
	context: AgentEnableDexAbstractionMutationContext,
): MutationOptions<AgentEnableDexAbstractionData, void> {
	return {
		mutationKey: createMutationKey("agentEnableDexAbstraction"),
		mutationFn: () => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.agentEnableDexAbstraction();
		},
	};
}

export function useExchangeAgentEnableDexAbstraction(
	options: UseExchangeAgentEnableDexAbstractionOptions = {},
): UseExchangeAgentEnableDexAbstractionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getAgentEnableDexAbstractionMutationOptions({ exchange })));
}
