import type { ClaimRewardsSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ClaimRewardsData = ClaimRewardsSuccessResponse;

export type UseExchangeClaimRewardsOptions = MutationParameter<ClaimRewardsData, void>;
export type UseExchangeClaimRewardsReturnType = UseMutationResult<ClaimRewardsData, HyperliquidQueryError, void>;

interface ClaimRewardsMutationContext {
	exchange: ExchangeClient | null;
}

export function getClaimRewardsMutationOptions(
	context: ClaimRewardsMutationContext,
): MutationOptions<ClaimRewardsData, void> {
	return {
		mutationKey: createMutationKey("claimRewards"),
		mutationFn: () => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.claimRewards();
		},
	};
}

export function useExchangeClaimRewards(
	options: UseExchangeClaimRewardsOptions = {},
): UseExchangeClaimRewardsReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getClaimRewardsMutationOptions({ exchange })));
}
