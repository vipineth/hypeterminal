import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ExchangeStatusResponse } from "@nktkas/hyperliquid";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type ExchangeStatusData = ExchangeStatusResponse;

export type UseInfoExchangeStatusOptions<TData = ExchangeStatusData> = QueryParameter<ExchangeStatusData, TData>;
export type UseInfoExchangeStatusReturnType<TData = ExchangeStatusData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoExchangeStatus<TData = ExchangeStatusData>(
  options: UseInfoExchangeStatusOptions<TData> = {},
): UseInfoExchangeStatusReturnType<TData> {
  const { info } = useHyperliquid();
  const queryKey = infoKeys.method("exchangeStatus");

  return useQuery({
    ...options,
    queryKey,
    queryFn: ({ signal }) => info.exchangeStatus(signal),
  });
}
