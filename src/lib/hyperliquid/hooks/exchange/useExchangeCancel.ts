import type { CancelParameters, CancelSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CancelData = CancelSuccessResponse;
type CancelParams = CancelParameters;

export type UseExchangeCancelOptions = MutationParameter<CancelData, CancelParams>;
export type UseExchangeCancelReturnType = UseMutationResult<CancelData, HyperliquidQueryError, CancelParams>;

export function useExchangeCancel(options: UseExchangeCancelOptions = {}): UseExchangeCancelReturnType {
	const { exchange } = useHyperliquidClients();
	const { clientKey } = useHyperliquid();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cancel", clientKey),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cancel(params);
		},
	});
}
