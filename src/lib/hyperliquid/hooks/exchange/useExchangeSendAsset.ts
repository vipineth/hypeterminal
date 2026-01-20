import type { ExchangeClient, SendAssetParameters, SendAssetSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SendAssetData = SendAssetSuccessResponse;
type SendAssetParams = SendAssetParameters;

export type UseExchangeSendAssetOptions = MutationParameter<SendAssetData, SendAssetParams>;
export type UseExchangeSendAssetReturnType = UseMutationResult<SendAssetData, HyperliquidQueryError, SendAssetParams>;

interface SendAssetMutationContext {
	exchange: ExchangeClient | null;
}

export function getSendAssetMutationOptions(
	context: SendAssetMutationContext,
): MutationOptions<SendAssetData, SendAssetParams> {
	return {
		mutationKey: createMutationKey("sendAsset"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.sendAsset(params);
		},
	};
}

export function useExchangeSendAsset(options: UseExchangeSendAssetOptions = {}): UseExchangeSendAssetReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSendAssetMutationOptions({ exchange })));
}
