import type { NoopSuccessResponse } from "@nktkas/hyperliquid";
import { type UseMutationResult, useMutation } from "@tanstack/react-query";
import { MissingWalletError } from "../../errors";
import { exchangeKeys } from "../../query/keys";
import type { HyperliquidQueryError, MutationParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type NoopData = NoopSuccessResponse;

export type UseExchangeNoopOptions = MutationParameter<NoopData, void>;
export type UseExchangeNoopReturnType = UseMutationResult<NoopData, HyperliquidQueryError, void>;

export function useExchangeNoop(options: UseExchangeNoopOptions = {}): UseExchangeNoopReturnType {
	const { exchange } = useHyperliquidClients();

	return useMutation({
		...options,
		mutationKey: exchangeKeys.method("noop"),
		mutationFn: () => {
			if (!exchange) throw new MissingWalletError();
			return exchange.noop();
		},
	});
}
