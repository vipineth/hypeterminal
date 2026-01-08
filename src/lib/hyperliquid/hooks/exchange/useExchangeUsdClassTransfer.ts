import type { UsdClassTransferParameters, UsdClassTransferSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type UsdClassTransferData = UsdClassTransferSuccessResponse;
type UsdClassTransferParams = UsdClassTransferParameters;

export type UseExchangeUsdClassTransferOptions = MutationParameter<UsdClassTransferData, UsdClassTransferParams>;
export type UseExchangeUsdClassTransferReturnType = UseMutationResult<
	UsdClassTransferData,
	HyperliquidQueryError,
	UsdClassTransferParams
>;

export function useExchangeUsdClassTransfer(
	options: UseExchangeUsdClassTransferOptions = {},
): UseExchangeUsdClassTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("usdClassTransfer"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.usdClassTransfer(params);
		},
	});
}
