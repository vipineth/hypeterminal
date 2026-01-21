import type { InfoClient, LeadingVaultsParameters, LeadingVaultsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { infoKeys } from "@/lib/hyperliquid/query/keys";
import { computeEnabled, type QueryOptions } from "@/lib/hyperliquid/query/options";
import type { HyperliquidQueryError, QueryParameter } from "@/lib/hyperliquid/types";

type LeadingVaultsData = LeadingVaultsResponse;
type LeadingVaultsParams = LeadingVaultsParameters;

export type UseInfoLeadingVaultsParameters = LeadingVaultsParams;
export type UseInfoLeadingVaultsOptions<TData = LeadingVaultsData> = QueryParameter<LeadingVaultsData, TData>;
export type UseInfoLeadingVaultsReturnType<TData = LeadingVaultsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function getLeadingVaultsQueryOptions(
	info: InfoClient,
	params: LeadingVaultsParams,
): QueryOptions<LeadingVaultsData> {
	return {
		queryKey: infoKeys.method("leadingVaults", params),
		queryFn: ({ signal }) => info.leadingVaults(params, signal),
	};
}

export function useInfoLeadingVaults<TData = LeadingVaultsData>(
	params: UseInfoLeadingVaultsParameters,
	options: UseInfoLeadingVaultsOptions<TData> = {},
): UseInfoLeadingVaultsReturnType<TData> {
	const { info } = useHyperliquid();
	const queryOptions = getLeadingVaultsQueryOptions(info, params);
	const enabled = computeEnabled(Boolean(params.user), options);

	const query = useQuery({
		...options,
		...queryOptions,
		enabled,
	});

	return query;
}
