import type { ExchangeClient, SubAccountModifyParameters, SubAccountModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
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

export function getSubAccountModifyMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SubAccountModifyData, SubAccountModifyParams> {
	return {
		mutationKey: createMutationKey("subAccountModify"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.subAccountModify(params)),
	};
}

export function useExchangeSubAccountModify(
	options: UseExchangeSubAccountModifyOptions = {},
): UseExchangeSubAccountModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountModifyMutationOptions(exchange)));
}
