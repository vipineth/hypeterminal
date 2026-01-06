import type { ApproveBuilderFeeParameters, ApproveBuilderFeeSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
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

export function useExchangeApproveBuilderFee(
	options: UseExchangeApproveBuilderFeeOptions = {},
): UseExchangeApproveBuilderFeeReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("approveBuilderFee"),
		mutationFn: (params) => {
			if (!exchange) throw new MissingWalletError();
			return exchange.approveBuilderFee(params);
		},
	});
}
