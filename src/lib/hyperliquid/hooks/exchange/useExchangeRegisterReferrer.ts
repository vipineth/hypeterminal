import type { ExchangeClient, RegisterReferrerParameters, RegisterReferrerSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "../../query/mutation-options";
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

export function getRegisterReferrerMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<RegisterReferrerData, RegisterReferrerParams> {
	return {
		mutationKey: createMutationKey("registerReferrer"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.registerReferrer(params)),
	};
}

export function useExchangeRegisterReferrer(
	options: UseExchangeRegisterReferrerOptions = {},
): UseExchangeRegisterReferrerReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getRegisterReferrerMutationOptions(exchange)));
}
