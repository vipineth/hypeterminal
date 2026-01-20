import type { Withdraw3Parameters, Withdraw3SuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { MissingWalletError } from "../../errors";
import type { HyperliquidQueryError, MutationParameter } from "../../types";

type Withdraw3Data = Withdraw3SuccessResponse;
type Withdraw3Params = Withdraw3Parameters;

export type UseExchangeWithdraw3Options = MutationParameter<Withdraw3Data, Withdraw3Params>;
export type UseExchangeWithdraw3ReturnType = UseMutationResult<Withdraw3Data, HyperliquidQueryError, Withdraw3Params>;

export function useExchangeWithdraw3(options: UseExchangeWithdraw3Options = {}): UseExchangeWithdraw3ReturnType {
	const { exchangeClient } = useHyperliquid();

	return useMutation({
		...options,
		mutationFn: (params) => {
			if (!exchangeClient) throw new MissingWalletError();
			return exchangeClient.withdraw3(params);
		},
	});
}
