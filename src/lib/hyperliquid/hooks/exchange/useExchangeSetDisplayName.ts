import type { SetDisplayNameParameters, SetDisplayNameSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SetDisplayNameData = SetDisplayNameSuccessResponse;
type SetDisplayNameParams = SetDisplayNameParameters;

export type UseExchangeSetDisplayNameOptions = MutationParameter<SetDisplayNameData, SetDisplayNameParams>;
export type UseExchangeSetDisplayNameReturnType = UseMutationResult<
	SetDisplayNameData,
	HyperliquidQueryError,
	SetDisplayNameParams
>;

export function useExchangeSetDisplayName(
	options: UseExchangeSetDisplayNameOptions = {},
): UseExchangeSetDisplayNameReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("setDisplayName"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.setDisplayName(params);
		},
	});
}
