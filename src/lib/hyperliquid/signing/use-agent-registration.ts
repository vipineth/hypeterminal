import type { ExtraAgentsResponse } from "@nktkas/hyperliquid";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useConnection, useWalletClient } from "wagmi";
import { createExchangeClient } from "../clients";
import { useHyperliquid } from "../context";
import { infoKeys } from "../query/keys";
import { toHyperliquidWallet } from "../wallet";
import { useAgentWalletActions, useAgentWalletStorage } from "./agent-storage";
import { convertFeeToPercentageString, isAgentApproved, isBuilderFeeApproved } from "./agent-utils";
import type { RegistrationStatus } from "./types";

export interface UseAgentRegistrationResult {
	register: () => Promise<`0x${string}`>;
	status: RegistrationStatus;
	error: Error | null;
	reset: () => void;
}

export function useAgentRegistration(): UseAgentRegistrationResult {
	const { env, agentName, builderConfig } = useHyperliquid();
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();
	const queryClient = useQueryClient();

	const [status, setStatus] = useState<RegistrationStatus>("idle");
	const [error, setError] = useState<Error | null>(null);

	const agentWallet = useAgentWalletStorage(env, address);
	const { setAgent, clearAgent } = useAgentWalletActions();

	const hasBuilderConfig = !!builderConfig?.b;

	const register = useCallback(async (): Promise<`0x${string}`> => {
		if (!address) throw new Error("No wallet connected");
		if (!walletClient) throw new Error("No wallet client available");

		const wallet = toHyperliquidWallet(walletClient, address);
		if (!wallet) throw new Error("Failed to create wallet adapter");

		const exchangeClient = createExchangeClient(wallet);

		setError(null);
		setStatus("approving_fee");

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

				setStatus("verifying");
				await queryClient.invalidateQueries({
					queryKey: infoKeys.method("maxBuilderFee", { user: address, builder: builderConfig.b }),
				});
			}

			setStatus("approving_agent");

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

				setStatus("verifying");
				await queryClient.invalidateQueries({
					queryKey: infoKeys.method("extraAgents", { user: address }),
				});
			}

			setStatus("idle");
			return agentWallet?.publicKey ?? "0x0";
		} catch (err) {
			setStatus("error");
			const nextError = err instanceof Error ? err : new Error(String(err));
			setError(nextError);
			throw nextError;
		}
	}, [
		address,
		walletClient,
		env,
		agentName,
		builderConfig,
		hasBuilderConfig,
		clearAgent,
		setAgent,
		queryClient,
		agentWallet,
	]);

	const reset = useCallback(() => {
		if (address) clearAgent(env, address);
		setStatus("idle");
		setError(null);
	}, [address, env, clearAgent]);

	return { register, status, error, reset };
}
