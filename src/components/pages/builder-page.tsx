import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { approveBuilderFee } from "@nktkas/hyperliquid/api/exchange";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { isAddress } from "viem";
import { useConnection, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHttpTransport } from "@/lib/hyperliquid/clients";
import { makeExchangeConfig } from "@/lib/hyperliquid/exchange";
import { toHyperliquidWallet } from "@/lib/hyperliquid/wallet";
import { cn } from "@/lib/utils";
import { WalletDialog } from "../trade/components/wallet-dialog";

type Status = "idle" | "signing" | "submitting" | "success" | "error";

export function BuilderPage() {
	const { address, isConnected } = useConnection();
	const { data: walletClient, isLoading: isWalletLoading } = useWalletClient();

	const [builderAddress, setBuilderAddress] = useState("");
	const [maxFeeRate, setMaxFeeRate] = useState("0.01");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [walletDialogOpen, setWalletDialogOpen] = useState(false);

	const isValidAddress = builderAddress.length === 0 || isAddress(builderAddress);
	const feeRateNumber = Number.parseFloat(maxFeeRate);
	const isValidFeeRate = !Number.isNaN(feeRateNumber) && feeRateNumber > 0 && feeRateNumber <= 1;

	const canSubmit =
		isConnected &&
		walletClient &&
		builderAddress.length === 42 &&
		isAddress(builderAddress) &&
		isValidFeeRate &&
		status !== "signing" &&
		status !== "submitting";

	const handleSubmit = async () => {
		if (!canSubmit || !walletClient || !address) return;

		setStatus("signing");
		setErrorMessage(null);

		try {
			const wallet = toHyperliquidWallet(walletClient, address);
			if (!wallet) {
				throw new Error(t`Could not create wallet`);
			}

			const transport = getHttpTransport();
			const config = makeExchangeConfig(transport, wallet);

			setStatus("submitting");

			const feeRateFormatted = `${maxFeeRate}%`;
			await approveBuilderFee(config, {
				maxFeeRate: feeRateFormatted,
				builder: builderAddress as `0x${string}`,
			});

			setStatus("success");
		} catch (error) {
			console.error("[BuilderPage] Registration failed:", error);
			const message = error instanceof Error ? error.message : t`Failed to register builder code`;
			setErrorMessage(message);
			setStatus("error");
		}
	};

	const handleReset = () => {
		setStatus("idle");
		setErrorMessage(null);
		setBuilderAddress("");
		setMaxFeeRate("0.01");
	};

	const isProcessing = status === "signing" || status === "submitting";

	return (
		<div className="min-h-screen bg-background text-foreground font-mono">
			<div className="max-w-2xl mx-auto p-6 space-y-6">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold tracking-tight">
						<Trans>Register Builder Code</Trans>
					</h1>
					<p className="text-sm text-muted-foreground">
						<Trans>
							Approve a builder to charge fees on orders placed on your behalf. Builder codes allow DeFi
							applications to receive a portion of trading fees.
						</Trans>
					</p>
				</div>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle className="text-lg">
							<Trans>Builder Fee Approval</Trans>
						</CardTitle>
						<CardDescription>
							<Trans>
								This action must be signed by your main wallet (not an agent/API wallet). The builder must
								have at least 100 USDC in perps account value.
							</Trans>
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{!isConnected ? (
							<div className="space-y-4">
								<div className="p-4 border border-border/60 bg-muted/20 text-sm text-muted-foreground text-center">
									<Trans>Connect your wallet to register a builder code</Trans>
								</div>
								<Button onClick={() => setWalletDialogOpen(true)} className="w-full" variant="terminal">
									<Trans>Connect Wallet</Trans>
								</Button>
							</div>
						) : status === "success" ? (
							<div className="space-y-4">
								<div className="p-4 border border-terminal-green/40 bg-terminal-green/10 flex items-start gap-3">
									<CheckCircle2 className="size-5 text-terminal-green shrink-0 mt-0.5" />
									<div className="space-y-1">
										<p className="text-sm font-medium text-terminal-green">
											<Trans>Builder code registered successfully!</Trans>
										</p>
										<p className="text-xs text-muted-foreground">
											<Trans>
												The builder at {builderAddress.slice(0, 6)}...{builderAddress.slice(-4)} can now
												charge up to {maxFeeRate}% fee on orders placed on your behalf.
											</Trans>
										</p>
									</div>
								</div>
								<Button onClick={handleReset} variant="outline" className="w-full">
									<Trans>Register Another</Trans>
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="builder-address" className="text-xs uppercase tracking-wider">
										<Trans>Builder Address</Trans>
									</Label>
									<Input
										id="builder-address"
										placeholder="0x..."
										value={builderAddress}
										onChange={(e) => setBuilderAddress(e.target.value)}
										className={cn(
											"font-mono",
											builderAddress.length > 0 && !isValidAddress && "border-terminal-red",
										)}
										disabled={isProcessing}
									/>
									{builderAddress.length > 0 && !isValidAddress && (
										<p className="text-xs text-terminal-red">
											<Trans>Invalid Ethereum address</Trans>
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="max-fee-rate" className="text-xs uppercase tracking-wider">
										<Trans>Max Fee Rate (%)</Trans>
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id="max-fee-rate"
											type="number"
											step="0.001"
											min="0.001"
											max="1"
											placeholder="0.01"
											value={maxFeeRate}
											onChange={(e) => setMaxFeeRate(e.target.value)}
											className={cn("font-mono flex-1", !isValidFeeRate && maxFeeRate && "border-terminal-red")}
											disabled={isProcessing}
										/>
										<span className="text-sm text-muted-foreground">%</span>
									</div>
									<p className="text-xs text-muted-foreground">
										<Trans>
											Max 0.1% (10 bps) for perps, 1% (100 bps) for spot. Enter as decimal (e.g., 0.01 for
											1 basis point).
										</Trans>
									</p>
									{!isValidFeeRate && maxFeeRate && (
										<p className="text-xs text-terminal-red">
											<Trans>Fee rate must be between 0.001% and 1%</Trans>
										</p>
									)}
								</div>

								{errorMessage && (
									<div className="p-3 border border-terminal-red/40 bg-terminal-red/10 flex items-start gap-2">
										<AlertCircle className="size-4 text-terminal-red shrink-0 mt-0.5" />
										<p className="text-xs text-terminal-red">{errorMessage}</p>
									</div>
								)}

								<div className="pt-2">
									<Button
										onClick={handleSubmit}
										disabled={!canSubmit}
										className="w-full"
										variant="terminal"
									>
										{isProcessing && <Loader2 className="size-4 animate-spin mr-2" />}
										{status === "signing" ? (
											<Trans>Sign in wallet...</Trans>
										) : status === "submitting" ? (
											<Trans>Submitting...</Trans>
										) : (
											<Trans>Register Builder Code</Trans>
										)}
									</Button>
								</div>

								{isConnected && (
									<p className="text-xs text-muted-foreground text-center">
										<Trans>
											Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
										</Trans>
									</p>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle className="text-sm">
							<Trans>About Builder Codes</Trans>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-xs text-muted-foreground">
						<p>
							<Trans>
								Builder codes allow DeFi builders to receive a fee on fills they send on behalf of users.
								They are set per-order for maximal flexibility.
							</Trans>
						</p>
						<p>
							<Trans>
								You can revoke permissions at any time by registering a new approval with 0% fee rate.
								Builder codes are processed entirely onchain as part of the fee logic.
							</Trans>
						</p>
						<div className="pt-2 space-y-1">
							<p className="font-medium text-foreground">
								<Trans>Fee Limits:</Trans>
							</p>
							<ul className="list-disc list-inside space-y-1 pl-2">
								<li>
									<Trans>Perps: Max 0.1% (10 basis points)</Trans>
								</li>
								<li>
									<Trans>Spot: Max 1% (100 basis points)</Trans>
								</li>
							</ul>
						</div>
						<div className="pt-2 space-y-1">
							<p className="font-medium text-foreground">
								<Trans>Requirements:</Trans>
							</p>
							<ul className="list-disc list-inside space-y-1 pl-2">
								<li>
									<Trans>Builder must have at least 100 USDC in perps account value</Trans>
								</li>
								<li>
									<Trans>Must be signed by main wallet (not agent/API wallet)</Trans>
								</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>

			<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
		</div>
	);
}
