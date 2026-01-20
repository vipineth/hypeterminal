import type {
	ApproveBuilderFeeParameters,
	ApproveBuilderFeeSuccessResponse,
	ExchangeClient,
} from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { createMutationKey, type MutationOptions, mergeMutationOptions } from "../../query/mutation-options";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type ApproveBuilderFeeData = ApproveBuilderFeeSuccessResponse;
type ApproveBuilderFeeParams = ApproveBuilderFeeParameters;

export type UseExchangeApproveBuilderFeeOptions = MutationParameter<ApproveBuilderFeeData, ApproveBuilderFeeParams>;
export type UseExchangeApproveBuilderFeeReturnType = UseMutationResult<
	ApproveBuilderFeeData,
	HyperliquidQueryError,
	ApproveBuilderFeeParams
>;

interface ApproveBuilderFeeMutationContext {
	exchange: ExchangeClient | null;
}

export function getApproveBuilderFeeMutationOptions(
	context: ApproveBuilderFeeMutationContext,
): MutationOptions<ApproveBuilderFeeData, ApproveBuilderFeeParams> {
	return {
		mutationKey: createMutationKey("approveBuilderFee"),
		mutationFn: (params) => {
			if (!context.exchange) throw new MissingWalletError();
			return context.exchange.approveBuilderFee(params);
		},
	};
}

export function useExchangeApproveBuilderFee(
	options: UseExchangeApproveBuilderFeeOptions = {},
): UseExchangeApproveBuilderFeeReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation(mergeMutationOptions(options, getApproveBuilderFeeMutationOptions({ exchange })));
}
