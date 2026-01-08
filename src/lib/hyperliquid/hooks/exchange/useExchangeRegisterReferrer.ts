import type { RegisterReferrerParameters, RegisterReferrerSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type RegisterReferrerData = RegisterReferrerSuccessResponse;
type RegisterReferrerParams = RegisterReferrerParameters;

export type UseExchangeRegisterReferrerOptions = MutationParameter<RegisterReferrerData, RegisterReferrerParams>;
export type UseExchangeRegisterReferrerReturnType = UseMutationResult<
	RegisterReferrerData,
	HyperliquidQueryError,
	RegisterReferrerParams
>;

export function useExchangeRegisterReferrer(
	options: UseExchangeRegisterReferrerOptions = {},
): UseExchangeRegisterReferrerReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("registerReferrer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.registerReferrer(params);
		},
	});
}
