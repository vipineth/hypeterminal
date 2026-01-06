import type { SubAccountSpotTransferParameters, SubAccountSpotTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SubAccountSpotTransferData = SubAccountSpotTransferSuccessResponse;
type SubAccountSpotTransferParams = SubAccountSpotTransferParameters;

export type UseExchangeSubAccountSpotTransferOptions = MutationParameter<
	SubAccountSpotTransferData,
	SubAccountSpotTransferParams
>;
export type UseExchangeSubAccountSpotTransferReturnType = UseMutationResult<
	SubAccountSpotTransferData,
	HyperliquidQueryError,
	SubAccountSpotTransferParams
>;

export function useExchangeSubAccountSpotTransfer(
	options: UseExchangeSubAccountSpotTransferOptions = {},
): UseExchangeSubAccountSpotTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("subAccountSpotTransfer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.subAccountSpotTransfer(params);
		},
	});
}
