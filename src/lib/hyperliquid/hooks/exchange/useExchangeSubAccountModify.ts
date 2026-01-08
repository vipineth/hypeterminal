import type { SubAccountModifyParameters, SubAccountModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SubAccountModifyData = SubAccountModifySuccessResponse;
type SubAccountModifyParams = SubAccountModifyParameters;

export type UseExchangeSubAccountModifyOptions = MutationParameter<SubAccountModifyData, SubAccountModifyParams>;
export type UseExchangeSubAccountModifyReturnType = UseMutationResult<
	SubAccountModifyData,
	HyperliquidQueryError,
	SubAccountModifyParams
>;

export function useExchangeSubAccountModify(
	options: UseExchangeSubAccountModifyOptions = {},
): UseExchangeSubAccountModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("subAccountModify"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.subAccountModify(params);
		},
	});
}
