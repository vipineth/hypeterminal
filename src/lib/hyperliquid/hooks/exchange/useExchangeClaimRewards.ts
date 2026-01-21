import type { ClaimRewardsSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

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
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getClaimRewardsMutationOptions(trading)));
}
