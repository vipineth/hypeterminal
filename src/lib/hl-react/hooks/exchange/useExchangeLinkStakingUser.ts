import type { LinkStakingUserParameters, LinkStakingUserSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeLinkStakingUser(
	options: UseExchangeLinkStakingUserOptions = {},
): UseExchangeLinkStakingUserReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("linkStakingUser"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.linkStakingUser(params);
		},
	});
}
