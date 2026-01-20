import type { ExchangeClient, LinkStakingUserParameters, LinkStakingUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface LinkStakingUserMutationContext {
	exchange: ExchangeClient | null;
}

export function getLinkStakingUserMutationOptions(
	context: LinkStakingUserMutationContext,
): MutationOptions<LinkStakingUserData, LinkStakingUserParams> {
	return {
		mutationKey: createMutationKey("linkStakingUser"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.linkStakingUser(params);
		},
	};
}

export function useExchangeLinkStakingUser(
	options: UseExchangeLinkStakingUserOptions = {},
): UseExchangeLinkStakingUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getLinkStakingUserMutationOptions({ exchange })));
}
