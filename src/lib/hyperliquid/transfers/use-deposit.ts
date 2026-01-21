import { t } from "@lingui/core/macro";
import { useCallback } from "react";
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
import type { TransferValidation } from "./types";

export type DepositStatus = "idle" | "pending" | "confirming" | "success" | "error";

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
	validate: (amount: string) => TransferValidation;
	reset: () => void;
}

export function useDeposit(): UseDepositResult {
	const { address } = useConnection();
	const chainId = useChainId();
	const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

	const { mutate: switchChain, isPending: isSwitching, error: switchError } = useSwitchChain();

	const { data: balanceRaw, refetch } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: isArbitrum && !!address },
	});

	const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
	const { isLoading: isConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash });

	const error = writeError || confirmError;

	const status: DepositStatus = isPending
		? "pending"
		: isConfirming
			? "confirming"
			: isSuccess
				? "success"
				: error
					? "error"
					: "idle";

	const switchToArbitrum = useCallback(() => {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}, [switchChain]);

	const validate = useCallback(
		(amount: string): TransferValidation => {
			if (!amount || amount === "0") return { valid: false, error: null };
			try {
				const raw = parseUnits(amount, USDC_DECIMALS);
				if (raw < MIN_DEPOSIT_USDC) return { valid: false, error: t`Minimum deposit is 5 USDC` };
				if (balanceRaw && raw > balanceRaw) return { valid: false, error: t`Insufficient balance` };
				return { valid: true, error: null };
			} catch {
				return { valid: false, error: t`Invalid amount` };
			}
		},
		[balanceRaw],
	);

	const deposit = useCallback(
		(amount: string) => {
			if (!address) return;
			writeContract(
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
		[address, writeContract, refetch],
	);

	return {
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		switchError,
		balance: balanceRaw ? formatUnits(balanceRaw, USDC_DECIMALS) : "0",
		status,
		error,
		hash,
		deposit,
		validate,
		reset,
	};
}
