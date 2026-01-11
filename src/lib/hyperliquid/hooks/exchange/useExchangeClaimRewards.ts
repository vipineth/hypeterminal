import type { ClaimRewardsSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ClaimRewardsData = ClaimRewardsSuccessResponse;

export type UseExchangeClaimRewardsOptions = MutationParameter<ClaimRewardsData, void>;
export type UseExchangeClaimRewardsReturnType = UseMutationResult<ClaimRewardsData, HyperliquidQueryError, void>;

export function useExchangeClaimRewards(
	options: UseExchangeClaimRewardsOptions = {},
): UseExchangeClaimRewardsReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("claimRewards"),
		mutationFn: () => {
			if (!exchange) throw new MissingWalletError();
			return exchange.claimRewards();
		},
	});
}
