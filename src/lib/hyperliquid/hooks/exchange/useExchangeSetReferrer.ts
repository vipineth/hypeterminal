import type { ExchangeClient, SetReferrerParameters, SetReferrerSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface SetReferrerMutationContext {
	exchange: ExchangeClient | null;
}

export function getSetReferrerMutationOptions(
	context: SetReferrerMutationContext,
): MutationOptions<SetReferrerData, SetReferrerParams> {
	return {
		mutationKey: createMutationKey("setReferrer"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.setReferrer(params);
		},
	};
}

export function useExchangeSetReferrer(options: UseExchangeSetReferrerOptions = {}): UseExchangeSetReferrerReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSetReferrerMutationOptions({ exchange })));
}
