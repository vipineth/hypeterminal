import type { TwapCancelParameters, TwapCancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type TwapCancelData = TwapCancelSuccessResponse;
type TwapCancelParams = TwapCancelParameters;

export type UseExchangeTwapCancelOptions = MutationParameter<TwapCancelData, TwapCancelParams>;
export type UseExchangeTwapCancelReturnType = UseMutationResult<
	TwapCancelData,
	HyperliquidQueryError,
	TwapCancelParams
>;

export function useExchangeTwapCancel(options: UseExchangeTwapCancelOptions = {}): UseExchangeTwapCancelReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("twapCancel"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.twapCancel(params);
		},
	});
}
