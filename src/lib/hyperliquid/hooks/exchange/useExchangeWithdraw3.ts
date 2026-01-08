import type { Withdraw3Parameters, Withdraw3SuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type Withdraw3Data = Withdraw3SuccessResponse;
type Withdraw3Params = Withdraw3Parameters;

export type UseExchangeWithdraw3Options = MutationParameter<Withdraw3Data, Withdraw3Params>;
export type UseExchangeWithdraw3ReturnType = UseMutationResult<Withdraw3Data, HyperliquidQueryError, Withdraw3Params>;

export function useExchangeWithdraw3(options: UseExchangeWithdraw3Options = {}): UseExchangeWithdraw3ReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("withdraw3"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.withdraw3(params);
		},
	});
}
