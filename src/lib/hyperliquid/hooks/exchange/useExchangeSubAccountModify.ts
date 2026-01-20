import type { ExchangeClient, SubAccountModifyParameters, SubAccountModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SubAccountModifyData = SubAccountModifySuccessResponse;
type SubAccountModifyParams = SubAccountModifyParameters;

export type UseExchangeSubAccountModifyOptions = MutationParameter<SubAccountModifyData, SubAccountModifyParams>;
export type UseExchangeSubAccountModifyReturnType = UseMutationResult<
	SubAccountModifyData,
	HyperliquidQueryError,
	SubAccountModifyParams
>;

interface SubAccountModifyMutationContext {
	exchange: ExchangeClient | null;
}

export function getSubAccountModifyMutationOptions(
	context: SubAccountModifyMutationContext,
): MutationOptions<SubAccountModifyData, SubAccountModifyParams> {
	return {
		mutationKey: createMutationKey("subAccountModify"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.subAccountModify(params);
		},
	};
}

export function useExchangeSubAccountModify(
	options: UseExchangeSubAccountModifyOptions = {},
): UseExchangeSubAccountModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountModifyMutationOptions({ exchange })));
}
