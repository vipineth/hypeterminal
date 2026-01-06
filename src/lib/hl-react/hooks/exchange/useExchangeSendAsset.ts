import type { SendAssetParameters, SendAssetSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type SendAssetData = SendAssetSuccessResponse;
type SendAssetParams = SendAssetParameters;

export type UseExchangeSendAssetOptions = MutationParameter<SendAssetData, SendAssetParams>;
export type UseExchangeSendAssetReturnType = UseMutationResult<SendAssetData, HyperliquidQueryError, SendAssetParams>;

export function useExchangeSendAsset(options: UseExchangeSendAssetOptions = {}): UseExchangeSendAssetReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("sendAsset"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.sendAsset(params);
		},
	});
}
