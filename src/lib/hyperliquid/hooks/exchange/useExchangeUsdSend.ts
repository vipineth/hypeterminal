import type { UsdSendParameters, UsdSendSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UsdSendData = UsdSendSuccessResponse;
type UsdSendParams = UsdSendParameters;

export type UseExchangeUsdSendOptions = MutationParameter<UsdSendData, UsdSendParams>;
export type UseExchangeUsdSendReturnType = UseMutationResult<UsdSendData, HyperliquidQueryError, UsdSendParams>;

export function useExchangeUsdSend(options: UseExchangeUsdSendOptions = {}): UseExchangeUsdSendReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("usdSend"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.usdSend(params);
		},
	});
}
