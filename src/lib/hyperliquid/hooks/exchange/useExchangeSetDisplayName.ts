import type { ExchangeClient, SetDisplayNameParameters, SetDisplayNameSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { createMutationKey, guardedMutationFn, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SetDisplayNameData = SetDisplayNameSuccessResponse;
type SetDisplayNameParams = SetDisplayNameParameters;

export type UseExchangeSetDisplayNameOptions = MutationParameter<SetDisplayNameData, SetDisplayNameParams>;
export type UseExchangeSetDisplayNameReturnType = UseMutationResult<
	SetDisplayNameData,
	HyperliquidQueryError,
	SetDisplayNameParams
>;

export function getSetDisplayNameMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SetDisplayNameData, SetDisplayNameParams> {
	return {
		mutationKey: createMutationKey("setDisplayName"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.setDisplayName(params)),
	};
}

export function useExchangeSetDisplayName(
	options: UseExchangeSetDisplayNameOptions = {},
): UseExchangeSetDisplayNameReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSetDisplayNameMutationOptions(exchange)));
}
