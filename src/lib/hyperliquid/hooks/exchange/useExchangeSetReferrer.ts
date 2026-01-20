import type { ExchangeClient, SetReferrerParameters, SetReferrerSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
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

export function getSetReferrerMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SetReferrerData, SetReferrerParams> {
	return {
		mutationKey: createMutationKey("setReferrer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.setReferrer(params)),
	};
}

export function useExchangeSetReferrer(options: UseExchangeSetReferrerOptions = {}): UseExchangeSetReferrerReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSetReferrerMutationOptions(exchange)));
}
