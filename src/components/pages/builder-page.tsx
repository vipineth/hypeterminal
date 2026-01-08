// import { approveBuilderFee } from "@nktkas/hyperliquid/api/exchange";
// import { useMutation } from "@tanstack/react-query";
// import { AlertCircle, Calculator, CheckCircle2, Loader2 } from "lucide-react";
// import { useMemo, useState } from "react";
// import { useConnection, useWalletClient } from "wagmi";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// export function BuilderPage() {
// 	const [builderAddress, setBuilderAddress] = useState("");
// 	const [maxFeeRate, setMaxFeeRate] = useState("0.01%");

// 	// Calculator state
// 	const [volume, setVolume] = useState("100000");

// 	const calculations = useMemo(() => {
// 		const vol = parseFloat(volume) || 0;
// 		const rateStr = maxFeeRate.replace("%", "");
// 		const rate = parseFloat(rateStr) || 0;
// 		const rateDecimal = rate / 100;

// 		// Cap rates to max allowed
// 		const perpRate = Math.min(rateDecimal, 0.001); // max 0.1%
// 		const spotRate = Math.min(rateDecimal, 0.01); // max 1%

// 		return {
// 			perp: vol * perpRate,
// 			spot: vol * spotRate,
// 			perpRate: (perpRate * 100).toFixed(3),
// 			spotRate: (spotRate * 100).toFixed(3),
// 		};
// 	}, [volume, maxFeeRate]);

// 	return (
// 		<div className="min-h-screen bg-background text-foreground font-mono">
// 			<div className="max-w-4xl mx-auto p-6 space-y-6">
// 				<div>
// 					<h1 className="text-2xl font-bold">Register Builder Code</h1>
// 					<p className="text-sm text-muted-foreground mt-1">
// 						Approve a builder to charge fees on orders placed on your behalf.
// 					</p>
// 				</div>

// 				<div className="grid md:grid-cols-2 gap-6">
// 					{/* Registration Form */}
// 					<div className="space-y-6">
// 						<Card>
// 							<CardHeader>
// 								<CardTitle>Builder Fee Approval</CardTitle>
// 								<CardDescription>Must be signed by your main wallet (not agent/API wallet).</CardDescription>
// 							</CardHeader>
// 							<CardContent className="space-y-4">
// 								<div className="space-y-2">
// 									<Label>Builder Address</Label>
// 									<Input
// 										placeholder="0x..."
// 										value={builderAddress}
// 										onChange={(e) => setBuilderAddress(e.target.value)}
// 										className="font-mono"
// 									/>
// 								</div>

// 								<div className="space-y-2">
// 									<Label>Max Fee Rate</Label>
// 									<Input
// 										placeholder="0.01%"
// 										value={maxFeeRate}
// 										onChange={(e) => setMaxFeeRate(e.target.value)}
// 										className="font-mono"
// 									/>
// 									<p className="text-xs text-muted-foreground">
// 										Format: 0.01% = 1 basis point. Max 0.1% for perps, 1% for spot.
// 									</p>
// 								</div>

// 								{mutation.error && (
// 									<div className="p-3 bg-destructive/10 border border-destructive/30 rounded flex items-start gap-2">
// 										<AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
// 										<p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
// 									</div>
// 								)}

// 								{mutation.isSuccess && (
// 									<div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-start gap-2">
// 										<CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
// 										<p className="text-sm text-green-500">Builder code registered successfully!</p>
// 									</div>
// 								)}

// 								<Button
// 									onClick={() => mutation.mutate()}
// 									disabled={mutation.isPending || !builderAddress}
// 									className="w-full"
// 									variant="terminal"
// 								>
// 									{mutation.isPending && <Loader2 className="size-4 animate-spin mr-2" />}
// 									{mutation.isPending ? "Signing..." : "Register Builder Code"}
// 								</Button>
// 							</CardContent>
// 						</Card>

// 						<Card>
// 							<CardHeader>
// 								<CardTitle className="text-sm">Things to Know</CardTitle>
// 							</CardHeader>
// 							<CardContent className="text-sm text-muted-foreground space-y-2">
// 								<ul className="list-disc list-inside space-y-1">
// 									<li>Builder must have at least 100 USDC in perps account value</li>
// 									<li>Fee limits: 0.1% (10 bps) for perps, 1% (100 bps) for spot</li>
// 									<li>Revoke anytime by setting fee rate to 0%</li>
// 									<li>Fees are processed onchain as part of fill logic</li>
// 								</ul>
// 							</CardContent>
// 						</Card>
// 					</div>

// 					{/* Fee Calculator */}
// 					<Card>
// 						<CardHeader>
// 							<CardTitle className="flex items-center gap-2">
// 								<Calculator className="size-5" />
// 								Fee Calculator
// 							</CardTitle>
// 							<CardDescription>Estimate builder fee earnings based on trading volume.</CardDescription>
// 						</CardHeader>
// 						<CardContent className="space-y-6">
// 							<div className="space-y-2">
// 								<Label>Trading Volume (USD)</Label>
// 								<Input
// 									type="number"
// 									placeholder="100000"
// 									value={volume}
// 									onChange={(e) => setVolume(e.target.value)}
// 									className="font-mono"
// 								/>
// 							</div>

// 							<div className="space-y-4">
// 								<div className="p-4 bg-muted/30 rounded space-y-3">
// 									<div className="flex justify-between items-center">
// 										<span className="text-sm text-muted-foreground">Perps Fee Rate</span>
// 										<span className="font-mono text-sm">{calculations.perpRate}%</span>
// 									</div>
// 									<div className="flex justify-between items-center">
// 										<span className="text-sm">Perps Earnings</span>
// 										<span className="font-mono text-lg text-green-500">
// 											$
// 											{calculations.perp.toLocaleString(undefined, {
// 												minimumFractionDigits: 2,
// 												maximumFractionDigits: 2,
// 											})}
// 										</span>
// 									</div>
// 								</div>

// 								<div className="p-4 bg-muted/30 rounded space-y-3">
// 									<div className="flex justify-between items-center">
// 										<span className="text-sm text-muted-foreground">Spot Fee Rate</span>
// 										<span className="font-mono text-sm">{calculations.spotRate}%</span>
// 									</div>
// 									<div className="flex justify-between items-center">
// 										<span className="text-sm">Spot Earnings</span>
// 										<span className="font-mono text-lg text-green-500">
// 											$
// 											{calculations.spot.toLocaleString(undefined, {
// 												minimumFractionDigits: 2,
// 												maximumFractionDigits: 2,
// 											})}
// 										</span>
// 									</div>
// 								</div>
// 							</div>

// 							<div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
// 								<p>• Perps capped at 0.1% (10 bps)</p>
// 								<p>• Spot capped at 1% (100 bps)</p>
// 								<p>• Actual earnings depend on fill volume</p>
// 							</div>
// 						</CardContent>
// 					</Card>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }
