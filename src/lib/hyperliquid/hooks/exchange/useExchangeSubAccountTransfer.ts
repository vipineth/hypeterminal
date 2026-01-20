import type {
	ExchangeClient,
	SubAccountTransferParameters,
	SubAccountTransferSuccessResponse,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
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

interface SubAccountTransferMutationContext {
	exchange: ExchangeClient | null;
}

export function getSubAccountTransferMutationOptions(
	context: SubAccountTransferMutationContext,
): MutationOptions<SubAccountTransferData, SubAccountTransferParams> {
	return {
		mutationKey: createMutationKey("subAccountTransfer"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.subAccountTransfer(params);
		},
	};
}

export function useExchangeSubAccountTransfer(
	options: UseExchangeSubAccountTransferOptions = {},
): UseExchangeSubAccountTransferReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSubAccountTransferMutationOptions({ exchange })));
}
