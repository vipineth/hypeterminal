import type { ExchangeClient, SendAssetParameters, SendAssetSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type SendAssetData = SendAssetSuccessResponse;
type SendAssetParams = SendAssetParameters;

export type UseExchangeSendAssetOptions = MutationParameter<SendAssetData, SendAssetParams>;
export type UseExchangeSendAssetReturnType = UseMutationResult<SendAssetData, HyperliquidQueryError, SendAssetParams>;

export function getSendAssetMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<SendAssetData, SendAssetParams> {
	return {
		mutationKey: createMutationKey("sendAsset"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.sendAsset(params)),
	};
}

export function useExchangeSendAsset(options: UseExchangeSendAssetOptions = {}): UseExchangeSendAssetReturnType {
	const { user } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getSendAssetMutationOptions(user)));
}
