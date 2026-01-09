import type { ExtraAgentsResponse } from "@nktkas/hyperliquid";
import { useCallback, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useQueryClient } from "@tanstack/react-query";
import { useHyperliquid } from "../context";
import type { AgentRegisterStatus, AgentStatus } from "./agent/types";
import { useAgentWallet, useAgentWalletActions, type AgentWallet } from "../state/agentWallet";
import { useInfoExtraAgents } from "./info/useInfoExtraAgents";
import { useInfoMaxBuilderFee } from "./info/useInfoMaxBuilderFee";
import { infoKeys } from "../query/keys";
import { convertFeeToPercentageString, isAgentApproved, isBuilderFeeApproved } from "../utils/agent";

export interface UseAgentRegistrationResult {
	status: AgentStatus;
	registerStatus: AgentRegisterStatus;
	agentWallet: AgentWallet | null;
	signer: ReturnType<typeof privateKeyToAccount> | null;
	register: () => Promise<`0x${string}`>;
	reset: () => void;
	error: Error | null;
	isReady: boolean;
}

export function useAgentRegistration(): UseAgentRegistrationResult {
	const { exchangeClient, env, agentName, builderConfig } = useHyperliquid();
	const { address } = useConnection();
	const queryClient = useQueryClient();

	const [registerStatus, setRegisterStatus] = useState<AgentRegisterStatus>("idle");
	const [error, setError] = useState<Error | null>(null);

	const agentWallet = useAgentWallet(env, address);
	const { setAgent, clearAgent } = useAgentWalletActions();

	const hasBuilderConfig = !!builderConfig?.b;

	const { data: maxBuilderFee, isLoading: isLoadingBuilderFee } = useInfoMaxBuilderFee(
		{ user: address ?? "0x0000000000000000000000000000000000000000", builder: builderConfig?.b ?? "0x0" },
		{ enabled: !!address && hasBuilderConfig, staleTime: 5_000 },
	);

	const { data: extraAgents, isLoading: isLoadingAgents } = useInfoExtraAgents(
		{ user: address ?? "0x0000000000000000000000000000000000000000" },
		{ enabled: !!address, staleTime: 5_000, refetchInterval: 30_000 },
	);

	const builderFeeApproved = !hasBuilderConfig || isBuilderFeeApproved(maxBuilderFee, builderConfig?.f);
	const agentApproved = isAgentApproved(extraAgents, agentWallet?.publicKey);

	const isLoading = (hasBuilderConfig && isLoadingBuilderFee) || isLoadingAgents;

	const status: AgentStatus = !address
		? "no_agent"
		: isLoading
			? "loading"
			: !builderFeeApproved
				? "needs_builder_fee"
				: !agentWallet
					? "no_agent"
					: agentApproved
						? "valid"
						: "invalid";

	const signer = useMemo(() => {
		if (status !== "valid" || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [status, agentWallet?.privateKey]);

	const register = useCallback(async (): Promise<`0x${string}`> => {
		if (!address) throw new Error("No wallet connected");
		if (!exchangeClient) throw new Error("No exchange client available");

		setError(null);
		setRegisterStatus("signing");

		try {
			const currentMaxBuilderFee = queryClient.getQueryData<number>(
				infoKeys.method("maxBuilderFee", { user: address, builder: builderConfig?.b ?? "0x0" }),
			);
			const needsBuilderFee = hasBuilderConfig && !isBuilderFeeApproved(currentMaxBuilderFee, builderConfig?.f);

			if (needsBuilderFee && builderConfig?.b && builderConfig?.f !== undefined) {
				await exchangeClient.approveBuilderFee({
					builder: builderConfig.b,
					maxFeeRate: convertFeeToPercentageString(builderConfig.f),
				});

				setRegisterStatus("verifying");
				await queryClient.invalidateQueries({
					queryKey: infoKeys.method("maxBuilderFee", { user: address, builder: builderConfig.b }),
				});
				setRegisterStatus("signing");
			}

			const currentExtraAgents = queryClient.getQueryData<ExtraAgentsResponse>(
				infoKeys.method("extraAgents", { user: address }),
			);
			const existingWallet = agentWallet;
			const needsAgentApproval = !isAgentApproved(currentExtraAgents, existingWallet?.publicKey);

			if (needsAgentApproval) {
				clearAgent(env, address);

				const privateKey = generatePrivateKey();
				const account = privateKeyToAccount(privateKey);
				const publicKey = account.address;

				setAgent(env, address, privateKey, publicKey);

				await exchangeClient.approveAgent({ agentAddress: publicKey, agentName });

				setRegisterStatus("verifying");
				await queryClient.invalidateQueries({
					queryKey: infoKeys.method("extraAgents", { user: address }),
				});
			}

			setRegisterStatus("idle");
			const wallet = queryClient.getQueryData<AgentWallet>(["agentWallet", env, address]) ?? agentWallet;
			return wallet?.publicKey ?? "0x0";
		} catch (err) {
			setRegisterStatus("error");
			const nextError = err instanceof Error ? err : new Error(String(err));
			setError(nextError);
			throw nextError;
		}
	}, [address, exchangeClient, env, agentName, builderConfig, hasBuilderConfig, clearAgent, setAgent, queryClient, agentWallet]);

	const reset = useCallback(() => {
		if (address) clearAgent(env, address);
		setRegisterStatus("idle");
		setError(null);
	}, [address, env, clearAgent]);

	return { status, registerStatus, agentWallet, signer, register, reset, error, isReady: status === "valid" };
}
