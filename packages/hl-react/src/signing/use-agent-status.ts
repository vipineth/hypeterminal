import type { ExtraAgentsResponse, MaxBuilderFeeResponse } from "@nktkas/hyperliquid";
import { type Address, zeroAddress } from "viem";
import { useConnection } from "wagmi";
import { useInfo } from "../hooks/useInfo";
import { useHyperliquid } from "../provider";
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
	const builderFeeKnown = !hasBuilderConfig || builderFeeData !== undefined;
	const extraAgentsKnown = extraAgentsData !== undefined;

	const needsBuilderFee =
		hasBuilderConfig && builderFeeKnown && !isBuilderFeeApproved(builderFeeData, builderConfig?.f);
	const needsAgent = extraAgentsKnown && !isAgentApproved(extraAgentsData, localAgentPublicKey);
	const signaturesRequired = (needsBuilderFee ? 1 : 0) + (needsAgent ? 1 : 0);

	return {
		needsBuilderFee,
		needsAgent,
		signaturesRequired,
		isReady: builderFeeKnown && extraAgentsKnown && signaturesRequired === 0,
	};
}

export function useAgentStatus(): UseAgentStatusResult {
	const { env, builderConfig } = useHyperliquid();
	const { address } = useConnection();

	const localAgent = useAgentWalletStorage(env, address);
	const hasBuilderConfig = !!builderConfig?.b;
	const userAddress = address ?? zeroAddress;

	const builderFeeQuery = useInfo(
		"maxBuilderFee",
		{ user: userAddress, builder: builderConfig?.b ?? zeroAddress },
		{ enabled: !!address && hasBuilderConfig },
	);

	const extraAgentsQuery = useInfo("extraAgents", { user: userAddress }, { enabled: !!address });

	const isLoading = builderFeeQuery.isLoading || extraAgentsQuery.isLoading;
	const requirements = deriveRequirements(
		builderFeeQuery.data,
		extraAgentsQuery.data,
		localAgent?.publicKey,
		builderConfig,
	);

	async function refetch(): Promise<AgentRequirements> {
		const [feeResult, agentsResult] = await Promise.all([
			hasBuilderConfig ? builderFeeQuery.refetch() : Promise.resolve(undefined),
			extraAgentsQuery.refetch(),
		]);

		if (hasBuilderConfig && feeResult?.data === undefined) {
			throw new Error("Could not load builder fee status");
		}
		if (agentsResult.data === undefined) {
			throw new Error("Could not load agent status");
		}

		return deriveRequirements(feeResult?.data, agentsResult.data, localAgent?.publicKey, builderConfig);
	}

	return {
		...requirements,
		isReady: !isLoading && requirements.isReady,
		isLoading,
		agentAddress: localAgent?.publicKey ?? null,
		refetch,
	};
}
