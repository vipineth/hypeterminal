import { useChainId, useSwitchChain } from "wagmi";
import { ARBITRUM_CHAIN_ID } from "@/config/contracts";

export function useArbitrumNetwork() {
	const chainId = useChainId();
	const { switchChain, isPending, error } = useSwitchChain();

	const isArbitrum = chainId === ARBITRUM_CHAIN_ID;

	function switchToArbitrum() {
		switchChain({ chainId: ARBITRUM_CHAIN_ID });
	}

	return {
		isArbitrum,
		switchToArbitrum,
		isSwitching: isPending,
		switchError: error,
	};
}
