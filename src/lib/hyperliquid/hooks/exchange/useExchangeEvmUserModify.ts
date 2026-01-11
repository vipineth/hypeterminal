import type { EvmUserModifyParameters, EvmUserModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type EvmUserModifyData = EvmUserModifySuccessResponse;
type EvmUserModifyParams = EvmUserModifyParameters;

export type UseExchangeEvmUserModifyOptions = MutationParameter<EvmUserModifyData, EvmUserModifyParams>;
export type UseExchangeEvmUserModifyReturnType = UseMutationResult<
	EvmUserModifyData,
	HyperliquidQueryError,
	EvmUserModifyParams
>;

export function useExchangeEvmUserModify(
	options: UseExchangeEvmUserModifyOptions = {},
): UseExchangeEvmUserModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("evmUserModify"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.evmUserModify(params);
		},
	});
}
