import type { SubAccountTransferParameters, SubAccountTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SubAccountTransferData = SubAccountTransferSuccessResponse;
type SubAccountTransferParams = SubAccountTransferParameters;

export type UseExchangeSubAccountTransferOptions = MutationParameter<SubAccountTransferData, SubAccountTransferParams>;
export type UseExchangeSubAccountTransferReturnType = UseMutationResult<
	SubAccountTransferData,
	HyperliquidQueryError,
	SubAccountTransferParams
>;

export function useExchangeSubAccountTransfer(
	options: UseExchangeSubAccountTransferOptions = {},
): UseExchangeSubAccountTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("subAccountTransfer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.subAccountTransfer(params);
		},
	});
}
