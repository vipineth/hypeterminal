import type { UserDexAbstractionParameters, UserDexAbstractionSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UserDexAbstractionData = UserDexAbstractionSuccessResponse;
type UserDexAbstractionParams = UserDexAbstractionParameters;

export type UseExchangeUserDexAbstractionOptions = MutationParameter<UserDexAbstractionData, UserDexAbstractionParams>;
export type UseExchangeUserDexAbstractionReturnType = UseMutationResult<
	UserDexAbstractionData,
	HyperliquidQueryError,
	UserDexAbstractionParams
>;

export function useExchangeUserDexAbstraction(
	options: UseExchangeUserDexAbstractionOptions = {},
): UseExchangeUserDexAbstractionReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("userDexAbstraction"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.userDexAbstraction(params);
		},
	});
}
