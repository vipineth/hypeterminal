import type { AgentEnableDexAbstractionSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
