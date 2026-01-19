import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ARBITRUM_CHAIN_ID, CONTRACTS, USDC_ABI } from "@/config/contracts";

export function useApproveUSDC() {
	const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	function approve(amount: bigint) {
		writeContract({
			address: CONTRACTS.arbitrum.usdc,
			abi: USDC_ABI,
			functionName: "approve",
			args: [CONTRACTS.arbitrum.bridge2, amount],
			chainId: ARBITRUM_CHAIN_ID,
		});
	}

	return {
		approve,
		hash,
		isPending,
		isConfirming,
		isSuccess,
		error,
		reset,
	};
}
