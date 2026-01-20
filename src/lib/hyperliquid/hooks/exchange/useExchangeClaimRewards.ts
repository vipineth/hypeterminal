import type { ClaimRewardsSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ClaimRewardsData = ClaimRewardsSuccessResponse;

export type UseExchangeClaimRewardsOptions = MutationParameter<ClaimRewardsData, void>;
export type UseExchangeClaimRewardsReturnType = UseMutationResult<ClaimRewardsData, HyperliquidQueryError, void>;

export function getClaimRewardsMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ClaimRewardsData, void> {
	return {
		mutationKey: createMutationKey("claimRewards"),
		mutationFn: guardedMutationFn(exchange, (ex) => ex.claimRewards()),
	};
}

export function useExchangeClaimRewards(
	options: UseExchangeClaimRewardsOptions = {},
): UseExchangeClaimRewardsReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getClaimRewardsMutationOptions(exchange)));
}
