import { formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { ARBITRUM_CHAIN_ID, CONTRACTS, USDC_ABI, USDC_DECIMALS } from "@/config/contracts";

interface Props {
	address: `0x${string}` | undefined;
	enabled?: boolean;
}

export function useUSDCBalance({ address, enabled = true }: Props) {
	const { data, isLoading, refetch } = useReadContract({
		address: CONTRACTS.arbitrum.usdc,
		abi: USDC_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		chainId: ARBITRUM_CHAIN_ID,
		query: { enabled: enabled && !!address },
	});

	return {
		balance: data ? formatUnits(data, USDC_DECIMALS) : "0",
		balanceRaw: data ?? 0n,
		isLoading,
		refetch,
	};
}
