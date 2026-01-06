import type { LeadingVaultsParameters, LeadingVaultsResponse } from "@nktkas/hyperliquid";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { infoKeys } from "../../query/keys";
import type { HyperliquidQueryError, QueryParameter } from "../../types";
import { useHyperliquidClients } from "../useClients";

type LeadingVaultsData = LeadingVaultsResponse;
type LeadingVaultsParams = LeadingVaultsParameters;

export type UseInfoLeadingVaultsParameters = LeadingVaultsParams;
export type UseInfoLeadingVaultsOptions<TData = LeadingVaultsData> = QueryParameter<LeadingVaultsData, TData>;
export type UseInfoLeadingVaultsReturnType<TData = LeadingVaultsData> = UseQueryResult<TData, HyperliquidQueryError>;

export function useInfoLeadingVaults<TData = LeadingVaultsData>(
	params: UseInfoLeadingVaultsParameters,
	options: UseInfoLeadingVaultsOptions<TData> = {},
): UseInfoLeadingVaultsReturnType<TData> {
	const { info } = useHyperliquidClients();
	const queryKey = infoKeys.method("leadingVaults", params);

	return useQuery({
		...options,
		queryKey,
		queryFn: ({ signal }) => info.leadingVaults(params, signal),
	});
}
