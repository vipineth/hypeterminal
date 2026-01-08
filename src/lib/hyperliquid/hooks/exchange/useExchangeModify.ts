import type { ModifyParameters, ModifySuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ModifyData = ModifySuccessResponse;
type ModifyParams = ModifyParameters;

export type UseExchangeModifyOptions = MutationParameter<ModifyData, ModifyParams>;
export type UseExchangeModifyReturnType = UseMutationResult<ModifyData, HyperliquidQueryError, ModifyParams>;

export function useExchangeModify(options: UseExchangeModifyOptions = {}): UseExchangeModifyReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("modify"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.modify(params);
		},
	});
}
