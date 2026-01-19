import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ARBITRUM_CHAIN_ID, BRIDGE2_ABI, CONTRACTS } from "@/config/contracts";

export function useDepositToHyperliquid() {
	const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	function deposit(amountRaw: bigint) {
		writeContract({
			address: CONTRACTS.arbitrum.bridge2,
			abi: BRIDGE2_ABI,
			functionName: "deposit",
			args: [amountRaw],
			chainId: ARBITRUM_CHAIN_ID,
		});
	}

	return {
		deposit,
		hash,
		isPending,
		isConfirming,
		isSuccess,
		error,
		reset,
	};
}
