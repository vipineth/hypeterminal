import type { InfoClient, LegalCheckParameters, LegalCheckResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "../../context";
import { infoKeys } from "../../query/keys";
import { computeEnabled, type QueryOptions } from "../../query/options";
import type { HyperliquidQueryError, QueryParameter } from "../../types";

type LegalCheckData = LegalCheckResponse;
type LegalCheckParams = LegalCheckParameters;

export type UseInfoLegalCheckParameters = LegalCheckParams;
export type UseInfoLegalCheckOptions<TData = LegalCheckData> = QueryParameter<LegalCheckData, TData>;
export type UseInfoLegalCheckReturnType<TData = LegalCheckData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getLegalCheckQueryOptions(info: InfoClient, params: LegalCheckParams): QueryOptions<LegalCheckData> {
	return {
		queryKey: infoKeys.method("legalCheck", params),
		queryFn: ({ signal }) => info.legalCheck(params, signal),
	};
}

export function useInfoLegalCheck<TData = LegalCheckData>(
	params: UseInfoLegalCheckParameters,
	options: UseInfoLegalCheckOptions<TData> = {},
): UseInfoLegalCheckReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getLegalCheckQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
