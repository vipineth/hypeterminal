import { approveBuilderFee } from "@nktkas/hyperliquid/api/exchange";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { makeExchangeConfig } from "@/lib/hyperliquid/exchange";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";

export function BuilderPage() {
	const { address } = useConnection();
	const { data: walletClient } = useWalletClient();

	const [builderAddress, setBuilderAddress] = useState("");
	const [maxFeeRate, setMaxFeeRate] = useState("0.01%");

	const mutation = useMutation({
		mutationFn: async () => {
			const wallet = toHyperliquidWallet(walletClient, address);
			if (!wallet) throw new Error("Wallet not connected");

			const config = makeExchangeConfig(getHttpTransport(), wallet);
			return approveBuilderFee(config, {
				maxFeeRate,
				builder: builderAddress as `0x${string}`,
			});
		},
	});

	return (
		<div className="max-w-md mx-auto p-6 space-y-4">
			<h1 className="text-xl font-bold">Register Builder Code</h1>

			<Input
				placeholder="Builder Address (0x...)"
				value={builderAddress}
				onChange={(e) => setBuilderAddress(e.target.value)}
			/>

			<Input
				placeholder="Max Fee Rate (e.g. 0.01%)"
				value={maxFeeRate}
				onChange={(e) => setMaxFeeRate(e.target.value)}
			/>

			{mutation.error && (
				<p className="text-red-500">{(mutation.error as Error).message}</p>
			)}

			{mutation.isSuccess && <p className="text-green-500">Success!</p>}

			<Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
				{mutation.isPending ? "Signing..." : "Register"}
			</Button>
		</div>
	);
}
