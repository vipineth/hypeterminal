import { useMemo } from "react";
import type { Address } from "viem";
import { type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { useConnection } from "wagmi";
import { useHyperliquid } from "../context";
import { useAgentWalletStorage } from "./agent-storage";
import type { AgentWallet } from "./types";
import { useAgentStatus } from "./use-agent-status";

export interface UseAgentWalletResult {
	data: AgentWallet | null;
	signer: PrivateKeyAccount | null;
	address: Address | null;
	isReady: boolean;
}

export function useAgentWallet(): UseAgentWalletResult {
	const { env } = useHyperliquid();
	const { address: userAddress } = useConnection();
	const { isReady } = useAgentStatus();

	const agentWallet = useAgentWalletStorage(env, userAddress);

	const signer = useMemo(() => {
		if (!isReady || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [isReady, agentWallet?.privateKey]);

	return {
		data: isReady ? agentWallet : null,
		signer,
		address: agentWallet?.publicKey ?? null,
		isReady: isReady && signer !== null,
	};
}
