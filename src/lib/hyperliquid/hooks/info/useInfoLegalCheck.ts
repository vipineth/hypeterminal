import type { LegalCheckParameters, LegalCheckResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type LegalCheckData = LegalCheckResponse;
type LegalCheckParams = LegalCheckParameters;

export type UseInfoLegalCheckParameters = LegalCheckParams;
export type UseInfoLegalCheckOptions<TData = LegalCheckData> = QueryParameter<LegalCheckData, TData>;
export type UseInfoLegalCheckReturnType<TData = LegalCheckData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoLegalCheck<TData = LegalCheckData>(
	params: UseInfoLegalCheckParameters,
	options: UseInfoLegalCheckOptions<TData> = {},
): UseInfoLegalCheckReturnType<TData> {
	const { info } = useHyperliquid();
	const queryKey = infoKeys.method("legalCheck", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.legalCheck(params, signal),
	});
}
