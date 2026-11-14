import { t } from "@lingui/core/macro";
import { useMemo } from "react";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";
import type { Collateral } from "@/domain/trade/account-mode";
import type { RegistrationStatus } from "@/lib/hyperliquid";
import type { ButtonContent, FormValidationResult, Side } from "@/lib/trade/types";

interface ButtonContentInput {
	isConnected: boolean;
	needsChainSwitch: boolean;
	isSwitchingChain: boolean;
	switchChain: (chainId: number) => void;
	collateral: Collateral;
	validation: FormValidationResult;
	isAgentLoading: boolean;
	registerStatus: RegistrationStatus;
	canApprove: boolean;
	side: Side;
	sideLabel: string;
	isSubmitting: boolean;
	onConnectWallet: () => void;
	onDeposit: () => void;
	onRegister: () => void;
	onSubmit: () => void;
}

function getRegisterText(isLoading: boolean, registerStatus: RegistrationStatus, canApprove: boolean): string {
	if (isLoading) return t`Loading...`;
	if (!canApprove) return t`Loading...`;
	if (registerStatus === "approving_fee" || registerStatus === "approving_agent") return t`Sign in wallet...`;
	if (registerStatus === "verifying") return t`Verifying...`;
	return t`Enable Trading`;
}

export function useButtonContent(input: ButtonContentInput): ButtonContent {
	const isRegistering =
		input.registerStatus === "approving_fee" ||
		input.registerStatus === "approving_agent" ||
		input.registerStatus === "verifying";

	const registerText = useMemo(
		() => getRegisterText(input.isAgentLoading, input.registerStatus, input.canApprove),
		[input.isAgentLoading, input.registerStatus, input.canApprove],
	);

	return useMemo<ButtonContent>(() => {
		if (!input.isConnected) {
			return {
				text: t`Connect Wallet`,
				action: input.onConnectWallet,
				disabled: false,
				variant: "cyan",
			};
		}
		if (input.needsChainSwitch) {
			return {
				text: input.isSwitchingChain ? t`Switching...` : t`Switch to Arbitrum`,
				action: () => input.switchChain(ARBITRUM_CHAIN_ID),
				disabled: input.isSwitchingChain,
				variant: "cyan",
			};
		}
		if (input.validation.needsApproval) {
			return {
				text: registerText,
				action: input.onRegister,
				disabled: isRegistering || !input.canApprove || input.isAgentLoading,
				variant: "cyan",
			};
		}
		if (input.collateral.status === "pending") {
			return { text: t`Checking margin…`, action: () => {}, disabled: true, variant: "cyan" };
		}
		if (input.collateral.shortfall?.kind === "noFunds") {
			return {
				text: t`Deposit`,
				action: input.onDeposit,
				disabled: false,
				variant: "cyan",
			};
		}
		return {
			text: t`Place ${input.sideLabel} Order`,
			action: input.onSubmit,
			disabled: !input.validation.canSubmit || input.isSubmitting,
			variant: input.side as "buy" | "sell",
		};
	}, [
		input.isConnected,
		input.needsChainSwitch,
		input.isSwitchingChain,
		input.switchChain,
		input.collateral,
		input.validation.needsApproval,
		input.validation.canSubmit,
		registerText,
		isRegistering,
		input.canApprove,
		input.isAgentLoading,
		input.onConnectWallet,
		input.onDeposit,
		input.onRegister,
		input.onSubmit,
		input.side,
		input.sideLabel,
		input.isSubmitting,
	]);
}

export type { ButtonContentInput };
