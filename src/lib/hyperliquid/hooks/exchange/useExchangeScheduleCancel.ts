import type { ScheduleCancelParameters, ScheduleCancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeScheduleCancel(
	options: UseExchangeScheduleCancelOptions = {},
): UseExchangeScheduleCancelReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("scheduleCancel"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.scheduleCancel(params);
		},
	});
}
