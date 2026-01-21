import type { ExtraAgentsResponse, MaxBuilderFeeResponse } from "@nktkas/hyperliquid";
import { type Address, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useInfoExtraAgents } from "@/lib/hyperliquid/hooks/info/useInfoExtraAgents";
import { useInfoMaxBuilderFee } from "@/lib/hyperliquid/hooks/info/useInfoMaxBuilderFee";
import { useHyperliquid } from "@/lib/hyperliquid/provider";
import { useAgentWalletStorage } from "./agent-storage";
import { isAgentApproved, isBuilderFeeApproved } from "./agent-utils";
import type { BuilderConfig } from "./types";

export interface AgentRequirements {
	needsBuilderFee: boolean;
	needsAgent: boolean;
	signaturesRequired: number;
	isReady: boolean;
}

export interface UseAgentStatusResult extends AgentRequirements {
	isLoading: boolean;
	agentAddress: Address | null;
	refetch: () => Promise<AgentRequirements>;
}

function deriveRequirements(
	builderFeeData: MaxBuilderFeeResponse | undefined,
	extraAgentsData: ExtraAgentsResponse | undefined,
	localAgentPublicKey: Address | undefined,
	builderConfig: BuilderConfig | undefined,
): AgentRequirements {
	const hasBuilderConfig = !!builderConfig?.b;
	const needsBuilderFee = hasBuilderConfig && !isBuilderFeeApproved(builderFeeData, builderConfig?.f);
	const needsAgent = !isAgentApproved(extraAgentsData, localAgentPublicKey);
	const signaturesRequired = (needsBuilderFee ? 1 : 0) + (needsAgent ? 1 : 0);

	return {
		needsBuilderFee,
		needsAgent,
		signaturesRequired,
		isReady: signaturesRequired === 0,
	};
}

export function useAgentStatus(): UseAgentStatusResult {
	const { env, builderConfig } = useHyperliquid();
	const { address } = useConnection();

	const localAgent = useAgentWalletStorage(env, address);
	const hasBuilderConfig = !!builderConfig?.b;
	const userAddress = address ?? zeroAddress;

	const builderFeeQuery = useInfoMaxBuilderFee(
		{ user: userAddress, builder: builderConfig?.b ?? zeroAddress },
		{ enabled: !!address && hasBuilderConfig },
	);

	const extraAgentsQuery = useInfoExtraAgents({ user: userAddress }, { enabled: !!address });

	const isLoading = builderFeeQuery.isLoading || extraAgentsQuery.isLoading;
	const requirements = deriveRequirements(
		builderFeeQuery.data,
		extraAgentsQuery.data,
		localAgent?.publicKey,
		builderConfig,
	);

	async function refetch(): Promise<AgentRequirements> {
		const [feeResult, agentsResult] = await Promise.all([builderFeeQuery.refetch(), extraAgentsQuery.refetch()]);

		return deriveRequirements(feeResult.data, agentsResult.data, localAgent?.publicKey, builderConfig);
	}

	return {
		...requirements,
		isReady: !isLoading && requirements.isReady,
		isLoading,
		agentAddress: localAgent?.publicKey ?? null,
		refetch,
	};
}
