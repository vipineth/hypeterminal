import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";
import { useArbitrumDeposit } from "@/hooks/arbitrum/use-arbitrum-deposit";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const ARBISCAN_TX_URL = "https://arbiscan.io/tx/";

export function DepositModal({ open, onOpenChange }: Props) {
	const [amount, setAmount] = useState("");

	const {
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		balance,
		step,
		error,
		startDeposit,
		validateAmount,
		needsApproval,
		reset,
		isApproving,
		isDepositing,
		depositHash,
	} = useArbitrumDeposit();

	const validation = validateAmount(amount);
	const showApproveStep = amount && validation.valid && needsApproval(BigInt(Math.floor(Number(amount) * 1e6)));

	function handleMaxClick() {
		setAmount(balance);
	}

	function handleDeposit() {
		if (validation.valid) {
			startDeposit(amount);
		}
	}

	function handleClose() {
		reset();
		setAmount("");
		onOpenChange(false);
	}

	function handleTryAgain() {
		reset();
	}

	if (!isArbitrum) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<Trans>Deposit USDC</Trans>
						</DialogTitle>
						<DialogDescription>
							<Trans>Switch to Arbitrum network to deposit.</Trans>
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-6">
						<div className="flex size-12 items-center justify-center rounded-full bg-terminal-amber/20">
							<AlertCircle className="size-6 text-terminal-amber" />
						</div>
						<p className="text-center text-sm text-muted-foreground">
							<Trans>Please switch to Arbitrum network to deposit USDC.</Trans>
						</p>
						<Button onClick={switchToArbitrum} disabled={isSwitching} className="w-full">
							{isSwitching ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									<Trans>Switching...</Trans>
								</>
							) : (
								<Trans>Switch to Arbitrum</Trans>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (step === "success") {
		return (
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<Trans>Deposit USDC</Trans>
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-6">
						<div className="flex size-12 items-center justify-center rounded-full bg-terminal-green/20">
							<CheckCircle2 className="size-6 text-terminal-green" />
						</div>
						<div className="text-center">
							<p className="font-medium">
								<Trans>Deposit Successful</Trans>
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								<Trans>{amount} USDC deposited to Hyperliquid</Trans>
							</p>
						</div>
						<p className="text-center text-xs text-muted-foreground">
							<Trans>Your funds will be available shortly.</Trans>
						</p>
						{depositHash && (
							<a
								href={`${ARBISCAN_TX_URL}${depositHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-xs text-terminal-cyan hover:underline"
							>
								<Trans>View on Arbiscan</Trans>
								<ExternalLink className="size-3" />
							</a>
						)}
						<Button onClick={handleClose} className="w-full">
							<Trans>Done</Trans>
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (step === "error") {
		return (
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<Trans>Deposit USDC</Trans>
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-6">
						<div className="flex size-12 items-center justify-center rounded-full bg-destructive/20">
							<AlertCircle className="size-6 text-destructive" />
						</div>
						<div className="text-center">
							<p className="font-medium">
								<Trans>Transaction Failed</Trans>
							</p>
							<p className="mt-1 text-sm text-muted-foreground">{error?.message ?? t`Unknown error`}</p>
						</div>
						<div className="flex w-full gap-2">
							<Button variant="outline" onClick={handleClose} className="flex-1">
								<Trans>Cancel</Trans>
							</Button>
							<Button onClick={handleTryAgain} className="flex-1">
								<Trans>Try Again</Trans>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	if (step === "approving" || step === "depositing") {
		const isApproveStep = step === "approving";
		return (
			<Dialog open={open} onOpenChange={() => {}}>
				<DialogContent className="sm:max-w-md" showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>
							<Trans>Deposit USDC</Trans>
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4 py-6">
						<Loader2 className="size-8 animate-spin text-terminal-cyan" />
						<div className="text-center">
							<p className="font-medium">
								{isApproveStep ? <Trans>Approving USDC...</Trans> : <Trans>Depositing...</Trans>}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">{amount} USDC → Hyperliquid</p>
						</div>
						{!isApproveStep && depositHash && (
							<a
								href={`${ARBISCAN_TX_URL}${depositHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-xs text-terminal-cyan hover:underline"
							>
								<Trans>View on Arbiscan</Trans>
								<ExternalLink className="size-3" />
							</a>
						)}
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Deposit USDC</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Transfer USDC from Arbitrum to your Hyperliquid account.</Trans>
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							<Trans>From: Arbitrum</Trans>
						</span>
						<span className="text-muted-foreground">
							<Trans>Balance:</Trans> {formatNumber(balance, 2)} USDC
						</span>
					</div>

					<div className="flex gap-2">
						<Input
							type="text"
							inputMode="decimal"
							placeholder="0.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							inputSize="lg"
							className={cn(validation.error && "border-destructive")}
						/>
						<Button variant="outline" size="lg" onClick={handleMaxClick}>
							<Trans>Max</Trans>
						</Button>
					</div>

					{validation.error && <p className="text-xs text-destructive">{validation.error}</p>}

					<Alert>
						<AlertCircle className="size-4" />
						<AlertDescription>
							<Trans>Minimum deposit: {formatUnits(MIN_DEPOSIT_USDC, USDC_DECIMALS)} USDC</Trans>
						</AlertDescription>
					</Alert>

					{showApproveStep && (
						<p className="text-xs text-muted-foreground">
							<Trans>Step 1 of 2: Approve USDC spending for the bridge.</Trans>
						</p>
					)}

					<Button
						onClick={handleDeposit}
						disabled={!validation.valid || isApproving || isDepositing}
						className="w-full"
					>
						{isApproving ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								<Trans>Approving...</Trans>
							</>
						) : isDepositing ? (
							<>
								<Loader2 className="size-4 animate-spin" />
								<Trans>Depositing...</Trans>
							</>
						) : showApproveStep ? (
							<Trans>Approve USDC</Trans>
						) : (
							<Trans>Deposit</Trans>
						)}
					</Button>

					<p className="text-center text-xs text-muted-foreground">
						<Trans>Funds arrive in less than 1 minute</Trans>
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
