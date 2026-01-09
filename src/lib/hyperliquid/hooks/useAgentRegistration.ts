import { useCallback, useMemo, useState } from "react";
import { useConnection } from "wagmi";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useQueryClient } from "@tanstack/react-query";
import { useHyperliquid } from "../context";
import type { AgentRegisterStatus, AgentStatus } from "./agent/types";
import { useAgentWallet, useAgentWalletActions, type AgentWallet } from "../state/agentWallet";
import { useInfoExtraAgents } from "./info/useInfoExtraAgents";
import { infoKeys } from "../query/keys";
import { isAgentApproved } from "../utils/agent";

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
	const { exchangeClient, env, agentName } = useHyperliquid();
	const { address } = useConnection();
	const queryClient = useQueryClient();

	const [registerStatus, setRegisterStatus] = useState<AgentRegisterStatus>("idle");
	const [error, setError] = useState<Error | null>(null);

	const agentWallet = useAgentWallet(env, address);
	const { setAgent, clearAgent } = useAgentWalletActions();

	const { data: extraAgents, isLoading } = useInfoExtraAgents(
		{ user: address ?? "0x0000000000000000000000000000000000000000" },
		{ enabled: !!address, staleTime: 5_000, refetchInterval: 30_000 },
	);

	const isValid = isAgentApproved(extraAgents, agentWallet?.publicKey);

	const status: AgentStatus = !address
		? "no_agent"
		: isLoading
			? "loading"
			: !agentWallet
				? "no_agent"
				: isValid
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

			setRegisterStatus("idle");
			return publicKey;
		} catch (err) {
			setRegisterStatus("error");
			const nextError = err instanceof Error ? err : new Error(String(err));
			setError(nextError);
			throw nextError;
		}
	}, [address, exchangeClient, env, agentName, clearAgent, setAgent, queryClient]);

	const reset = useCallback(() => {
		if (address) clearAgent(env, address);
		setRegisterStatus("idle");
		setError(null);
	}, [address, env, clearAgent]);

	return { status, registerStatus, agentWallet, signer, register, reset, error, isReady: status === "valid" };
}
