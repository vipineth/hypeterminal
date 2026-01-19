import { useReadContract } from "wagmi";
import { ARBITRUM_CHAIN_ID, CONTRACTS, USDC_ABI } from "@/config/contracts";

interface Props {
	owner: `0x${string}` | undefined;
	enabled?: boolean;
}

export function useUSDCAllowance({ owner, enabled = true }: Props) {
	const { data, isLoading, refetch } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: USDC_ABI,
		functionName: "allowance",
		args: owner ? [owner, CONTRACTS.arbitrum.bridge2] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: enabled && !!owner },
	});

	return {
		allowance: data ?? 0n,
		isLoading,
		refetch,
	};
}
