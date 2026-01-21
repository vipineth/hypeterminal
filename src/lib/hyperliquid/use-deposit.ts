import { t } from "@lingui/core/macro";
import { useCallback, useMemo } from "react";
import type { Hash } from "viem";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import {
	useChainId,
	useConnection,
	useReadContract,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "wagmi";
import { ARBITRUM_CHAIN_ID, CONTRACTS, MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";

export type DepositStatus = "idle" | "pending" | "confirming" | "success" | "error";

interface ValidationResult {
	valid: boolean;
	error: string | null;
}

export interface UseDepositResult {
	isArbitrum: boolean;
	switchToArbitrum: () => void;
	isSwitching: boolean;
	switchError: Error | null;
	balance: string;
	status: DepositStatus;
	error: Error | null;
	hash: Hash | undefined;
	deposit: (amount: string) => void;
	validate: (amount: string) => ValidationResult;
	reset: () => void;
}

function deriveStatus(isPending: boolean, isConfirming: boolean, isSuccess: boolean, error: Error | null): DepositStatus {
	if (isPending) return "pending";
	if (isConfirming) return "confirming";
	if (isSuccess) return "success";
	if (error) return "error";
	return "idle";
}

function validateAmount(amount: string, balanceRaw: bigint | undefined): ValidationResult {
	const trimmed = amount.trim();
	if (!trimmed) return { valid: false, error: null };

	try {
		const raw = parseUnits(trimmed, USDC_DECIMALS);
		if (raw === 0n) return { valid: false, error: null };
		if (raw < MIN_DEPOSIT_USDC) return { valid: false, error: t`Minimum deposit is 5 USDC` };
		if (balanceRaw !== undefined && raw > balanceRaw) return { valid: false, error: t`Insufficient balance` };
		return { valid: true, error: null };
	} catch {
		return { valid: false, error: t`Invalid amount` };
	}
}

function useArbitrumChain() {
	const chainId = useChainId();
	const { mutate, isPending, error } = useSwitchChain();

	const switchToArbitrum = useCallback(() => mutate({ chainId: ARBITRUM_CHAIN_ID }), [mutate]);

	return {
		isArbitrum: chainId === ARBITRUM_CHAIN_ID,
		switchToArbitrum,
		isSwitching: isPending,
		switchError: error,
	};
}

function useUsdcBalance(address: `0x${string}` | undefined, enabled: boolean) {
	const { data: balanceRaw, refetch } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled },
	});

	const balance = useMemo(() => (balanceRaw ? formatUnits(balanceRaw, USDC_DECIMALS) : "0"), [balanceRaw]);

	return { balanceRaw, balance, refetch };
}

export function useDeposit(): UseDepositResult {
	const { address } = useConnection();
	const chain = useArbitrumChain();
	const { balanceRaw, balance, refetch } = useUsdcBalance(address, chain.isArbitrum && !!address);

	const { mutate: write, data: hash, isPending, error: writeError, reset } = useWriteContract();
	const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

	const error = writeError ?? confirmError ?? null;
	const status = deriveStatus(isPending, isConfirming, isSuccess, error);

	const validate = useCallback((amount: string) => validateAmount(amount, balanceRaw), [balanceRaw]);

	const deposit = useCallback(
		(amount: string) => {
			if (!address) return;
			write(
				{
					address: CONTRACTS.arbitrum.usdc,
					abi: erc20Abi,
					functionName: "transfer",
					args: [CONTRACTS.arbitrum.bridge2, parseUnits(amount, USDC_DECIMALS)],
					chainId: ARBITRUM_CHAIN_ID,
				},
				{ onSuccess: () => refetch() },
			);
		},
		[address, write, refetch],
	);

	return {
		...chain,
		balance,
		status,
		error,
		hash,
		deposit,
		validate,
		reset,
	};
}
