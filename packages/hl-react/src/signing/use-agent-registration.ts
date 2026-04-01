import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { zeroAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useConnection } from "wagmi";
import { useExchange } from "../hooks/useExchange";
import { useHyperliquid } from "../provider";
import { useAgentWalletActions } from "./agent-storage";
import { convertFeeToPercentageString } from "./agent-utils";
import type { RegistrationStatus } from "./types";
import { useAgentStatus } from "./use-agent-status";

export type RegistrationStep = "fee" | "agent" | null;

export interface UseAgentRegistrationResult {
	register: () => Promise<Address>;
	status: RegistrationStatus;
	currentStep: RegistrationStep;
	error: Error | null;
	reset: () => void;
}

function deriveRegistrationStatus(
	isPending: boolean,
	isError: boolean,
	currentStep: RegistrationStep,
): RegistrationStatus {
	if (!isPending) return isError ? "error" : "idle";
	if (currentStep === "fee") return "approving_fee";
	if (currentStep === "agent") return "approving_agent";
	return "verifying";
}

export function useAgentRegistration(): UseAgentRegistrationResult {
	const { env, agentName, builderConfig } = useHyperliquid();
	const { address } = useConnection();

	const [currentStep, setCurrentStep] = useState<RegistrationStep>(null);
	const { setAgent, clearAgent } = useAgentWalletActions();
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const agentStatus = useAgentStatus();
	const approveBuilderFee = useExchange("approveBuilderFee");
	const approveAgent = useExchange("approveAgent");

	function safeSetStep(step: RegistrationStep) {
		if (mountedRef.current) setCurrentStep(step);
	}

	const registration = useMutation({
		mutationKey: ["hl", "registration", address],
		mutationFn: async (): Promise<Address> => {
			if (!address) throw new Error("No wallet connected");

			let requirements = await agentStatus.refetch();

			if (requirements.needsBuilderFee && builderConfig?.b && builderConfig?.f !== undefined) {
				safeSetStep("fee");
				await approveBuilderFee.mutateAsync({
					builder: builderConfig.b,
					maxFeeRate: convertFeeToPercentageString(builderConfig.f),
				});
				requirements = await agentStatus.refetch();
			}

			if (requirements.needsAgent) {
				safeSetStep("agent");
				clearAgent(env, address);

				const privateKey = generatePrivateKey();
				const account = privateKeyToAccount(privateKey);
				const publicKey = account.address;

				setAgent(env, address, privateKey, publicKey);
				await approveAgent.mutateAsync({ agentAddress: publicKey, agentName });
				await agentStatus.refetch();

				safeSetStep(null);
				return publicKey;
			}

			safeSetStep(null);
			return agentStatus.agentAddress ?? zeroAddress;
		},
	});

	const status = deriveRegistrationStatus(registration.isPending, registration.isError, currentStep);

	function reset() {
		if (address) clearAgent(env, address);
		registration.reset();
		setCurrentStep(null);
	}

	return {
		register: registration.mutateAsync,
		status,
		currentStep,
		error: registration.error,
		reset,
	};
}
