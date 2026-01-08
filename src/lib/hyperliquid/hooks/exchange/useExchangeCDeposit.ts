import type { CDepositParameters, CDepositSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CDepositData = CDepositSuccessResponse;
type CDepositParams = CDepositParameters;

export type UseExchangeCDepositOptions = MutationParameter<CDepositData, CDepositParams>;
export type UseExchangeCDepositReturnType = UseMutationResult<CDepositData, HyperliquidQueryError, CDepositParams>;

export function useExchangeCDeposit(options: UseExchangeCDepositOptions = {}): UseExchangeCDepositReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cDeposit"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cDeposit(params);
		},
	});
}
