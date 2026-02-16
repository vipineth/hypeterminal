import { useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { useConnect } from "wagmi";
import { mock } from "wagmi/connectors";
import { z } from "zod";
import { privateKeySchema, publicKeySchema, writeAgentToStorage } from "./agent-storage";
import type { HyperliquidEnv } from "./types";

const qrPayloadSchema = z.object({
	privateKey: privateKeySchema,
	chain: z.enum(["Mainnet", "Testnet"]) as z.ZodType<HyperliquidEnv>,
	userAddress: publicKeySchema,
});

export function useQrConnect() {
	const { connectAsync } = useConnect();
	const [error, setError] = useState<string | null>(null);

	function getErrorMessage(err: unknown): string {
		if (err instanceof z.ZodError) return "Invalid QR code";
		if (err instanceof SyntaxError) return "Invalid QR code format";
		if (err instanceof Error) return err.message;
		return "Connection failed";
	}

	async function connect(raw: string) {
		setError(null);

		try {
			const parsed = JSON.parse(raw);
			const { privateKey, chain, userAddress } = qrPayloadSchema.parse(parsed);

			const account = privateKeyToAccount(privateKey);

			writeAgentToStorage(chain, userAddress, privateKey, account.address);

			const connector = mock({
				accounts: [userAddress],
				features: { reconnect: true },
			});
			await connectAsync({ connector });
		} catch (err) {
			const message = getErrorMessage(err);
			setError(message);
			throw new Error(message);
		}
	}

	function reset() {
		setError(null);
	}

	return { connect, error, reset };
}
