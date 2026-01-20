import type { CancelByCloidParameters, CancelByCloidSuccessResponse, ExchangeClient } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface CancelByCloidMutationContext {
	exchange: ExchangeClient | null;
}

export function getCancelByCloidMutationOptions(
	context: CancelByCloidMutationContext,
): MutationOptions<CancelByCloidData, CancelByCloidParams> {
	return {
		mutationKey: createMutationKey("cancelByCloid"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.cancelByCloid(params);
		},
	};
}

export function useExchangeCancelByCloid(
	options: UseExchangeCancelByCloidOptions = {},
): UseExchangeCancelByCloidReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getCancelByCloidMutationOptions({ exchange })));
}
