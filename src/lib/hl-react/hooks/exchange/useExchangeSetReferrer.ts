import type { SetReferrerParameters, SetReferrerSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SetReferrerData = SetReferrerSuccessResponse;
type SetReferrerParams = SetReferrerParameters;

export type UseExchangeSetReferrerOptions = MutationParameter<SetReferrerData, SetReferrerParams>;
export type UseExchangeSetReferrerReturnType = UseMutationResult<
	SetReferrerData,
	HyperliquidQueryError,
	SetReferrerParams
>;

export function useExchangeSetReferrer(options: UseExchangeSetReferrerOptions = {}): UseExchangeSetReferrerReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("setReferrer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.setReferrer(params);
		},
	});
}
