import { useMemo } from "react";
import { type PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { useConnection } from "wagmi";
import { useHyperliquid } from "../context";
import { useAgentWalletStorage } from "./agent-storage";
import { useAgentStatus } from "./use-agent-status";
import type { AgentWallet } from "./types";

export interface UseAgentWalletResult {
	data: AgentWallet | null;
	signer: PrivateKeyAccount | null;
	address: `0x${string}` | null;
	isReady: boolean;
}

export function useAgentWallet(): UseAgentWalletResult {
	const { env } = useHyperliquid();
	const { address: userAddress } = useConnection();
	const { status } = useAgentStatus();

	const agentWallet = useAgentWalletStorage(env, userAddress);

	const signer = useMemo(() => {
		if (status !== "ready" || !agentWallet?.privateKey) return null;
		try {
			return privateKeyToAccount(agentWallet.privateKey);
		} catch {
			return null;
		}
	}, [status, agentWallet?.privateKey]);

	return {
		data: status === "ready" ? agentWallet : null,
		signer,
		address: agentWallet?.publicKey ?? null,
		isReady: status === "ready" && signer !== null,
	};
}
