import type { SpotSendParameters, SpotSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SpotSendData = SpotSendSuccessResponse;
type SpotSendParams = SpotSendParameters;

export type UseExchangeSpotSendOptions = MutationParameter<SpotSendData, SpotSendParams>;
export type UseExchangeSpotSendReturnType = UseMutationResult<SpotSendData, HyperliquidQueryError, SpotSendParams>;

export function useExchangeSpotSend(options: UseExchangeSpotSendOptions = {}): UseExchangeSpotSendReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("spotSend"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.spotSend(params);
		},
	});
}
