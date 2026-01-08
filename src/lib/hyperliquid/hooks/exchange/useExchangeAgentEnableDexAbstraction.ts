import type { AgentEnableDexAbstractionSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type AgentEnableDexAbstractionData = AgentEnableDexAbstractionSuccessResponse;

export type UseExchangeAgentEnableDexAbstractionOptions = MutationParameter<AgentEnableDexAbstractionData, void>;
export type UseExchangeAgentEnableDexAbstractionReturnType = UseMutationResult<
	AgentEnableDexAbstractionData,
	HyperliquidQueryError,
	void
>;

export function useExchangeAgentEnableDexAbstraction(
	options: UseExchangeAgentEnableDexAbstractionOptions = {},
): UseExchangeAgentEnableDexAbstractionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("agentEnableDexAbstraction"),
		mutationFn: () => {
			if (!exchange) throw new MissingWalletError();
			return exchange.agentEnableDexAbstraction();
		},
	});
}
