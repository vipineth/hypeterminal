import type { ExchangeClient, ScheduleCancelParameters, ScheduleCancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { assertExchange } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ScheduleCancelData = ScheduleCancelSuccessResponse;
type ScheduleCancelParams = ScheduleCancelParameters;

export type UseExchangeScheduleCancelOptions = MutationParameter<ScheduleCancelData, ScheduleCancelParams>;
export type UseExchangeScheduleCancelReturnType = UseMutationResult<
	ScheduleCancelData,
	HyperliquidQueryError,
	ScheduleCancelParams
>;

export function getScheduleCancelMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ScheduleCancelData, ScheduleCancelParams> {
	return {
		mutationKey: createMutationKey("scheduleCancel"),
		mutationFn: (params) => {
			assertExchange(exchange);
			return exchange.scheduleCancel(params);
		},
	};
}

export function useExchangeScheduleCancel(
	options: UseExchangeScheduleCancelOptions = {},
): UseExchangeScheduleCancelReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getScheduleCancelMutationOptions(exchange)));
}
