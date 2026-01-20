import type { ExchangeClient, SetDisplayNameParameters, SetDisplayNameSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface SetDisplayNameMutationContext {
	exchange: ExchangeClient | null;
}

export function getSetDisplayNameMutationOptions(
	context: SetDisplayNameMutationContext,
): MutationOptions<SetDisplayNameData, SetDisplayNameParams> {
	return {
		mutationKey: createMutationKey("setDisplayName"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.setDisplayName(params);
		},
	};
}

export function useExchangeSetDisplayName(
	options: UseExchangeSetDisplayNameOptions = {},
): UseExchangeSetDisplayNameReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSetDisplayNameMutationOptions({ exchange })));
}
