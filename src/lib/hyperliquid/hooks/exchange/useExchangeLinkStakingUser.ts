import type { ExchangeClient, LinkStakingUserParameters, LinkStakingUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

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
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getLinkStakingUserMutationOptions(exchange)));
}
