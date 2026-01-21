import type {
	ApproveBuilderFeeParameters,
	ApproveBuilderFeeSuccessResponse,
	ExchangeClient,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useHyperliquidClients } from "@/lib/hyperliquid/hooks/useClients";
import {
	createMutationKey,
	guardedMutationFn,
	type MutationOptions,
	mergeMutationOptions,
} from "@/lib/hyperliquid/query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "@/lib/hyperliquid/types";

type ApproveBuilderFeeData = ApproveBuilderFeeSuccessResponse;
type ApproveBuilderFeeParams = ApproveBuilderFeeParameters;

export type UseExchangeApproveBuilderFeeOptions = MutationParameter<ApproveBuilderFeeData, ApproveBuilderFeeParams>;
export type UseExchangeApproveBuilderFeeReturnType = UseMutationResult<
	ApproveBuilderFeeData,
	HyperliquidQueryError,
	ApproveBuilderFeeParams
>;

export function getApproveBuilderFeeMutationOptions(
	exchange: ExchangeClient | null,
): MutationOptions<ApproveBuilderFeeData, ApproveBuilderFeeParams> {
	return {
		mutationKey: createMutationKey("approveBuilderFee"),
		mutationFn: guardedMutationFn(exchange, (ex, params) => ex.approveBuilderFee(params)),
	};
}

export function useExchangeApproveBuilderFee(
	options: UseExchangeApproveBuilderFeeOptions = {},
): UseExchangeApproveBuilderFeeReturnType {
	const { user } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getApproveBuilderFeeMutationOptions(user)));
}
