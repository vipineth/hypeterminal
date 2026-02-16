import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useConnection } from "wagmi";
import { useExchangeApproveAgent } from "@/lib/hyperliquid/hooks/exchange/useExchangeApproveAgent";
import { useHyperliquid } from "@/lib/hyperliquid/provider";

type MobileSyncStatus = "idle" | "generating" | "approving" | "ready" | "error";

interface MobileSyncPayload {
	privateKey: Hex;
	chain: string;
	userAddress: string;
}

export interface UseMobileSyncResult {
	start: () => void;
	status: MobileSyncStatus;
	payload: MobileSyncPayload | null;
	error: Error | null;
	reset: () => void;
}

export function useMobileSync(): UseMobileSyncResult {
	const { env } = useHyperliquid();
	const { address } = useConnection();
	const approveAgent = useExchangeApproveAgent();

	const [payload, setPayload] = useState<MobileSyncPayload | null>(null);

	const mutation = useMutation({
		mutationKey: ["hl", "mobile-sync", address],
		mutationFn: async (): Promise<MobileSyncPayload> => {
			if (!address) throw new Error("No wallet connected");

			const privateKey = generatePrivateKey();
			const account = privateKeyToAccount(privateKey);

			await approveAgent.mutateAsync({
				agentAddress: account.address,
				agentName: "Mobile QR",
			});

			const result: MobileSyncPayload = {
				privateKey,
				chain: env,
				userAddress: address,
			};

			setPayload(result);
			return result;
		},
	});

	function getStatus(): MobileSyncStatus {
		if (mutation.isPending) return approveAgent.isPending ? "approving" : "generating";
		if (mutation.isError) return "error";
		if (payload) return "ready";
		return "idle";
	}

	const status = getStatus();

	function reset() {
		setPayload(null);
		mutation.reset();
		approveAgent.reset();
	}

	return {
		start: () => mutation.mutate(),
		status,
		payload,
		error: mutation.error,
		reset,
	};
}
