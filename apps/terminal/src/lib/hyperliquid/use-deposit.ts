import { useCallback } from "react";
import type { Hash } from "viem";
import { erc20Abi, parseUnits } from "viem";
import {
	useChainId,
	useConnection,
	useReadContract,
	useSwitchChain,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "wagmi";
import { ARBITRUM_CHAIN_ID, CONTRACTS, USDC_DECIMALS } from "@/config/contracts";
import {
	type DepositValidation,
	getUsdcBalance,
	type UsdcBalance,
	validateDeposit,
} from "@/lib/trade/deposit-validation";

export type DepositStatus = "idle" | "pending" | "confirming" | "success" | "error";

export interface UseDepositResult {
	isArbitrum: boolean;
	switchToArbitrum: () => void;
	isSwitching: boolean;
	switchError: Error | null;
	balance: UsdcBalance;
	refetchBalance: () => void;
	status: DepositStatus;
	error: Error | null;
	hash: Hash | undefined;
	deposit: (amount: string) => void;
	validate: (amount: string) => DepositValidation;
	reset: () => void;
}

function deriveStatus(
	isPending: boolean,
	isConfirming: boolean,
	isSuccess: boolean,
	error: Error | null,
): DepositStatus {
	if (isPending) return "pending";
	if (isConfirming) return "confirming";
	if (isSuccess) return "success";
	if (error) return "error";
	return "idle";
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
	const read = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled },
	});

	return { balance: getUsdcBalance(read), refetch: read.refetch };
}

export function useDeposit(): UseDepositResult {
	const { address } = useConnection();
	const chain = useArbitrumChain();
	const { balance, refetch } = useUsdcBalance(address, chain.isArbitrum && !!address);

	const { mutate: write, data: hash, isPending, error: writeError, reset } = useWriteContract();
	const {
		isLoading: isConfirming,
		isSuccess,
		error: confirmError,
	} = useWaitForTransactionReceipt({
		hash,
		chainId: ARBITRUM_CHAIN_ID,
	});

	const error = writeError ?? confirmError ?? null;
	const status = deriveStatus(isPending, isConfirming, isSuccess, error);

	const validate = (amount: string) => validateDeposit(amount, balance);

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
		refetchBalance: refetch,
		status,
		error,
		hash,
		deposit,
		validate,
		reset,
	};
}
