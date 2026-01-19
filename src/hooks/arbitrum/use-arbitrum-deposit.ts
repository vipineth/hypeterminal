import { useCallback, useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useConnection } from "wagmi";
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";
import { useApproveUSDC } from "./use-approve-usdc";
import { useArbitrumNetwork } from "./use-arbitrum-network";
import { useDepositToHyperliquid } from "./use-deposit-to-hyperliquid";
import { useUSDCAllowance } from "./use-usdc-allowance";
import { useUSDCBalance } from "./use-usdc-balance";

type DepositStep = "idle" | "approving" | "depositing" | "success" | "error";

export function useArbitrumDeposit() {
	const { address } = useConnection();
	const [step, setStep] = useState<DepositStep>("idle");
	const [pendingAmount, setPendingAmount] = useState<bigint>(0n);

	const { isArbitrum, switchToArbitrum, isSwitching } = useArbitrumNetwork();

	const {
		balance,
		balanceRaw,
		refetch: refetchBalance,
	} = useUSDCBalance({
		address,
		enabled: isArbitrum,
	});

	const { allowance, refetch: refetchAllowance } = useUSDCAllowance({
		owner: address,
		enabled: isArbitrum,
	});

	const {
		approve,
		isPending: isApproving,
		isConfirming: isApprovalConfirming,
		isSuccess: isApprovalSuccess,
		error: approvalError,
		reset: resetApproval,
	} = useApproveUSDC();

	const {
		deposit: executeDeposit,
		isPending: isDepositing,
		isConfirming: isDepositConfirming,
		isSuccess: isDepositSuccess,
		hash: depositHash,
		error: depositError,
		reset: resetDeposit,
	} = useDepositToHyperliquid();

	useEffect(() => {
		if (isApprovalSuccess && step === "approving" && pendingAmount > 0n) {
			refetchAllowance();
			setStep("depositing");
			executeDeposit(pendingAmount);
		}
	}, [isApprovalSuccess, step, pendingAmount, refetchAllowance, executeDeposit]);

	useEffect(() => {
		if (isDepositSuccess && step === "depositing") {
			setStep("success");
			refetchBalance();
		}
	}, [isDepositSuccess, step, refetchBalance]);

	useEffect(() => {
		if ((approvalError || depositError) && step !== "idle") {
			setStep("error");
		}
	}, [approvalError, depositError, step]);

	const needsApproval = useCallback((amount: bigint) => allowance < amount, [allowance]);

	const validateAmount = useCallback(
		(amount: string): { valid: boolean; error: string | null } => {
			if (!amount || amount === "0") {
				return { valid: false, error: null };
			}
			try {
				const amountRaw = parseUnits(amount, USDC_DECIMALS);
				if (amountRaw < MIN_DEPOSIT_USDC) {
					return { valid: false, error: "Minimum deposit is 5 USDC" };
				}
				if (amountRaw > balanceRaw) {
					return { valid: false, error: "Insufficient balance" };
				}
				return { valid: true, error: null };
			} catch {
				return { valid: false, error: "Invalid amount" };
			}
		},
		[balanceRaw],
	);

	const startDeposit = useCallback(
		(amount: string) => {
			const amountRaw = parseUnits(amount, USDC_DECIMALS);
			setPendingAmount(amountRaw);

			if (needsApproval(amountRaw)) {
				setStep("approving");
				approve(amountRaw);
			} else {
				setStep("depositing");
				executeDeposit(amountRaw);
			}
		},
		[needsApproval, approve, executeDeposit],
	);

	const reset = useCallback(() => {
		setStep("idle");
		setPendingAmount(0n);
		resetApproval();
		resetDeposit();
	}, [resetApproval, resetDeposit]);

	return {
		isArbitrum,
		switchToArbitrum,
		isSwitching,

		balance,
		balanceRaw,

		step,
		error: approvalError || depositError,

		startDeposit,
		validateAmount,
		needsApproval,
		reset,
		refetchBalance,

		isApproving: isApproving || isApprovalConfirming,
		isDepositing: isDepositing || isDepositConfirming,
		isSuccess: isDepositSuccess,
		depositHash,
	};
}
