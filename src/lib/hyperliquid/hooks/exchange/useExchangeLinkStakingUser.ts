import type { ExchangeClient, LinkStakingUserParameters, LinkStakingUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type LinkStakingUserData = LinkStakingUserSuccessResponse;
type LinkStakingUserParams = LinkStakingUserParameters;

export type UseExchangeLinkStakingUserOptions = MutationParameter<LinkStakingUserData, LinkStakingUserParams>;
export type UseExchangeLinkStakingUserReturnType = UseMutationResult<
	LinkStakingUserData,
	HyperliquidQueryError,
	LinkStakingUserParams
>;

export function getLinkStakingUserMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<LinkStakingUserData, LinkStakingUserParams> {
	return {
		mutationKey: createMutationKey("linkStakingUser"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.linkStakingUser(params)),
	};
}

export function useExchangeLinkStakingUser(
	options: UseExchangeLinkStakingUserOptions = {},
): UseExchangeLinkStakingUserReturnType {
	const { trading } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getLinkStakingUserMutationOptions(trading)));
}
