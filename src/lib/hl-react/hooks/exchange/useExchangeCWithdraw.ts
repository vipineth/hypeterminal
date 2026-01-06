import type { CWithdrawParameters, CWithdrawSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CWithdrawData = CWithdrawSuccessResponse;
type CWithdrawParams = CWithdrawParameters;

export type UseExchangeCWithdrawOptions = MutationParameter<CWithdrawData, CWithdrawParams>;
export type UseExchangeCWithdrawReturnType = UseMutationResult<CWithdrawData, HyperliquidQueryError, CWithdrawParams>;

export function useExchangeCWithdraw(options: UseExchangeCWithdrawOptions = {}): UseExchangeCWithdrawReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cWithdraw"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cWithdraw(params);
		},
	});
}
