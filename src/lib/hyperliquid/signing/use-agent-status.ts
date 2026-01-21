import { useMemo } from "react";
import { useConnection } from "wagmi";
import { useHyperliquid } from "../context";
import { useInfoExtraAgents } from "../hooks/info/useInfoExtraAgents";
import { useInfoMaxBuilderFee } from "../hooks/info/useInfoMaxBuilderFee";
import { isAgentApproved, isBuilderFeeApproved } from "./agent-utils";
import { useAgentWalletStorage } from "./agent-storage";
import type { AgentStatus } from "./types";

export interface UseAgentStatusResult {
	status: AgentStatus;
	agentAddress: `0x${string}` | null;
	isReady: boolean;
	isLoading: boolean;
}

export function useAgentStatus(): UseAgentStatusResult {
	const { env, builderConfig } = useHyperliquid();
	const { address } = useConnection();

	const agentWallet = useAgentWalletStorage(env, address);
	const hasBuilderConfig = !!builderConfig?.b;

	const { data: maxBuilderFee, isLoading: isLoadingBuilderFee } = useInfoMaxBuilderFee(
		{ user: address ?? "0x0", builder: builderConfig?.b ?? "0x0" },
		{ enabled: !!address && hasBuilderConfig, staleTime: 5_000 },
	);

	const { data: extraAgents, isLoading: isLoadingAgents } = useInfoExtraAgents(
		{ user: address ?? "0x0" },
		{ enabled: !!address, staleTime: 5_000, refetchInterval: 30_000 },
	);

	const builderFeeApproved = !hasBuilderConfig || isBuilderFeeApproved(maxBuilderFee, builderConfig?.f);
	const agentApproved = isAgentApproved(extraAgents, agentWallet?.publicKey);

	const isLoading = (hasBuilderConfig && isLoadingBuilderFee) || isLoadingAgents;

	const status: AgentStatus = useMemo(() => {
		if (!address) return "needs_agent";
		if (isLoading) return "loading";
		if (!builderFeeApproved) return "needs_builder_fee";
		if (!agentWallet) return "needs_agent";
		if (agentApproved) return "ready";
		return "invalid";
	}, [address, isLoading, builderFeeApproved, agentWallet, agentApproved]);

	return {
		status,
		agentAddress: agentWallet?.publicKey ?? null,
		isReady: status === "ready",
		isLoading,
	};
}
