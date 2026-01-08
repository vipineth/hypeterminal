import type { CancelByCloidParameters, CancelByCloidSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type CancelByCloidData = CancelByCloidSuccessResponse;
type CancelByCloidParams = CancelByCloidParameters;

export type UseExchangeCancelByCloidOptions = MutationParameter<CancelByCloidData, CancelByCloidParams>;
export type UseExchangeCancelByCloidReturnType = UseMutationResult<
	CancelByCloidData,
	HyperliquidQueryError,
	CancelByCloidParams
>;

export function useExchangeCancelByCloid(
	options: UseExchangeCancelByCloidOptions = {},
): UseExchangeCancelByCloidReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("cancelByCloid"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.cancelByCloid(params);
		},
	});
}
