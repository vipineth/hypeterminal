import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MIN_DEPOSIT_USDC, USDC_DECIMALS } from "@/config/contracts";
import { useArbitrumDeposit } from "@/hooks/arbitrum/use-arbitrum-deposit";
import { useHyperliquidWithdraw } from "@/hooks/arbitrum/use-hyperliquid-withdraw";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

const WITHDRAWAL_FEE_USD = 1;
const ARBISCAN_TX_URL = "https://arbiscan.io/tx/";

function getErrorMessage(error: Error | null): string {
	if (!error) return t`Unknown error`;
	const message = error.message;

	if (message.includes("User rejected") || message.includes("user rejected")) {
		return t`Transaction was rejected`;
	}
	if (message.includes("insufficient funds")) {
		return t`Insufficient funds for gas`;
	}
	if (message.includes("Must deposit before performing actions")) {
		return t`No balance on Hyperliquid. Deposit first.`;
	}

	const short = message.split("\n")[0];
	return short.length > 100 ? `${short.slice(0, 100)}...` : short;
}

interface InfoRowProps {
	label: React.ReactNode;
	value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
	return (
		<div className="flex items-center justify-between text-3xs">
			<span className="text-muted-foreground">{label}</span>
			<span>{value}</span>
		</div>
	);
}

interface StatusScreenProps {
	title: React.ReactNode;
	icon: "success" | "error" | "loading";
	heading: React.ReactNode;
	description?: React.ReactNode;
	txHash?: string;
	children?: React.ReactNode;
	onClose?: () => void;
	closable?: boolean;
}

function StatusScreen({ title, icon, heading, description, txHash, children, onClose, closable = true }: StatusScreenProps) {
	return (
		<Dialog open onOpenChange={closable ? onClose : undefined}>
			<DialogContent className="sm:max-w-md" showCloseButton={closable}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col items-center gap-4 py-4">
					{icon === "loading" ? (
						<Loader2 className="size-8 animate-spin text-terminal-cyan" />
					) : (
						<div
							className={cn(
								"flex size-12 items-center justify-center rounded-full",
								icon === "success" ? "bg-terminal-green/20" : "bg-terminal-red/20",
							)}
						>
							{icon === "success" ? (
								<CheckCircle2 className="size-6 text-terminal-green" />
							) : (
								<AlertCircle className="size-6 text-terminal-red" />
							)}
						</div>
					)}
					<div className="text-center space-y-1">
						<p className="text-sm font-medium">{heading}</p>
						{description && <p className="text-xs text-muted-foreground">{description}</p>}
					</div>
					{txHash && (
						<a
							href={`${ARBISCAN_TX_URL}${txHash}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-3xs text-terminal-cyan hover:underline"
						>
							<Trans>View transaction</Trans>
							<ExternalLink className="size-3" />
						</a>
					)}
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultTab?: "deposit" | "withdraw";
	onTabChange?: (tab: "deposit" | "withdraw") => void;
}

export function DepositModal({ open, onOpenChange, defaultTab = "deposit", onTabChange }: Props) {
	const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(defaultTab);
	const [depositAmount, setDepositAmount] = useState("");
	const [withdrawAmount, setWithdrawAmount] = useState("");

	useEffect(() => {
		setActiveTab(defaultTab);
	}, [defaultTab]);

	const {
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		switchError,
		balance: depositBalance,
		step: depositStep,
		error: depositError,
		startDeposit,
		validateAmount: validateDepositAmount,
		reset: resetDeposit,
		isPending: isDepositPending,
		depositHash,
	} = useArbitrumDeposit();

	const {
		address,
		withdrawable,
		balanceStatus,
		validateAmount: validateWithdrawAmount,
		startWithdraw,
		reset: resetWithdraw,
		isPending: isWithdrawPending,
		isSuccess: isWithdrawSuccess,
		error: withdrawError,
	} = useHyperliquidWithdraw();

	const depositValidation = validateDepositAmount(depositAmount);
	const withdrawValidation = validateWithdrawAmount(withdrawAmount);

	function handleTabChange(tab: "deposit" | "withdraw") {
		setActiveTab(tab);
		onTabChange?.(tab);
	}

	function handleClose() {
		resetDeposit();
		resetWithdraw();
		setDepositAmount("");
		setWithdrawAmount("");
		onOpenChange(false);
	}

	// Wrong network state
	if (!isArbitrum && activeTab === "deposit") {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<Trans>Transfer</Trans>
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="flex items-center gap-3 rounded-md border border-terminal-amber/40 bg-terminal-amber/10 p-3">
							<AlertCircle className="size-5 text-terminal-amber shrink-0" />
							<div className="space-y-0.5">
								<p className="text-xs font-medium">
									<Trans>Wrong network</Trans>
								</p>
								<p className="text-3xs text-muted-foreground">
									<Trans>Switch to Arbitrum to deposit</Trans>
								</p>
							</div>
						</div>
						{switchError && <p className="text-3xs text-terminal-red">{switchError.message}</p>}
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

	// Deposit success
	if (depositStep === "success") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="success"
				heading={<Trans>Deposit complete</Trans>}
				description={
					<>
						<span className="tabular-nums text-terminal-green">{depositAmount} USDC</span>{" "}
						<Trans>sent to Hyperliquid</Trans>
					</>
				}
				txHash={depositHash}
				onClose={handleClose}
			>
				<Button onClick={handleClose} className="w-full">
					<Trans>Done</Trans>
				</Button>
			</StatusScreen>
		);
	}

	// Deposit error
	if (depositStep === "error") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="error"
				heading={<Trans>Deposit failed</Trans>}
				description={<span className="text-3xs">{getErrorMessage(depositError)}</span>}
				onClose={handleClose}
			>
				<div className="flex w-full gap-2">
					<Button variant="outline" onClick={handleClose} className="flex-1">
						<Trans>Cancel</Trans>
					</Button>
					<Button onClick={resetDeposit} className="flex-1">
						<Trans>Retry</Trans>
					</Button>
				</div>
			</StatusScreen>
		);
	}

	// Deposit pending
	if (depositStep === "signing" || depositStep === "depositing") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="loading"
				heading={depositStep === "signing" ? <Trans>Confirm in wallet</Trans> : <Trans>Processing</Trans>}
				description={<span className="tabular-nums">{depositAmount} USDC → Hyperliquid</span>}
				txHash={depositStep === "depositing" ? depositHash : undefined}
				closable={false}
			/>
		);
	}

	// Withdraw success
	if (isWithdrawSuccess) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="success"
				heading={<Trans>Withdrawal submitted</Trans>}
				description={
					<>
						<span className="tabular-nums text-terminal-green">${withdrawAmount}</span>{" "}
						<Trans>will arrive in ~3 min</Trans>
					</>
				}
				onClose={handleClose}
			>
				<Button onClick={handleClose} className="w-full">
					<Trans>Done</Trans>
				</Button>
			</StatusScreen>
		);
	}

	// Withdraw error
	if (withdrawError) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="error"
				heading={<Trans>Withdrawal failed</Trans>}
				description={<span className="text-3xs">{getErrorMessage(withdrawError)}</span>}
				onClose={handleClose}
			>
				<div className="flex w-full gap-2">
					<Button variant="outline" onClick={handleClose} className="flex-1">
						<Trans>Cancel</Trans>
					</Button>
					<Button onClick={resetWithdraw} className="flex-1">
						<Trans>Retry</Trans>
					</Button>
				</div>
			</StatusScreen>
		);
	}

	// Withdraw pending
	if (isWithdrawPending) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="loading"
				heading={<Trans>Confirm in wallet</Trans>}
				description={<span className="tabular-nums">${withdrawAmount} → Arbitrum</span>}
				closable={false}
			/>
		);
	}

	// Main form
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Transfer</Trans>
					</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as "deposit" | "withdraw")} className="space-y-4">
					<TabsList>
						<TabsTrigger value="deposit" variant="underline">
							<Trans>Deposit</Trans>
						</TabsTrigger>
						<TabsTrigger value="withdraw" variant="underline">
							<Trans>Withdraw</Trans>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="deposit" className="space-y-4">
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-4xs uppercase tracking-wider text-muted-foreground">
									<Trans>Amount</Trans>
								</span>
								<span className="text-3xs text-muted-foreground">
									<span className="tabular-nums text-foreground">{formatNumber(depositBalance, 2)}</span> USDC
								</span>
							</div>
							<div className="flex items-center gap-1">
								<NumberInput
									placeholder="0.00"
									value={depositAmount}
									onChange={(e) => setDepositAmount(e.target.value)}
									className={cn(
										"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
										depositValidation.error && "border-terminal-red focus:border-terminal-red",
									)}
								/>
								<Button
									variant="ghost"
									size="none"
									onClick={() => setDepositAmount(depositBalance)}
									className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 hover:bg-transparent"
								>
									{t`Max`}
								</Button>
							</div>
							{depositValidation.error && <p className="text-4xs text-terminal-red">{depositValidation.error}</p>}
						</div>

						<div className="rounded-md border border-border/40 bg-muted/20 p-2.5 space-y-1.5">
							<InfoRow label={<Trans>From</Trans>} value="Arbitrum" />
							<InfoRow label={<Trans>To</Trans>} value="Hyperliquid" />
							<InfoRow
								label={<Trans>Min</Trans>}
								value={<span className="tabular-nums">{formatUnits(MIN_DEPOSIT_USDC, USDC_DECIMALS)} USDC</span>}
							/>
							<InfoRow label={<Trans>Time</Trans>} value="~1 min" />
						</div>

						<Button onClick={() => depositValidation.valid && startDeposit(depositAmount)} disabled={!depositValidation.valid || isDepositPending} className="w-full">
							{isDepositPending ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									<Trans>Processing...</Trans>
								</>
							) : (
								<Trans>Deposit</Trans>
							)}
						</Button>
					</TabsContent>

					<TabsContent value="withdraw" className="space-y-4">
						{!address ? (
							<div className="flex flex-col items-center gap-3 py-6">
								<AlertCircle className="size-6 text-muted-foreground" />
								<p className="text-xs text-muted-foreground">
									<Trans>Connect wallet to withdraw</Trans>
								</p>
							</div>
						) : (
							<>
								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-4xs uppercase tracking-wider text-muted-foreground">
											<Trans>Amount</Trans>
										</span>
										<span className="text-3xs text-muted-foreground">
											{balanceStatus === "subscribing" ? (
												<Trans>Loading...</Trans>
											) : (
												<>
													<span className="tabular-nums text-foreground">${formatNumber(withdrawable, 2)}</span>{" "}
													<Trans>available</Trans>
												</>
											)}
										</span>
									</div>
									<div className="flex items-center gap-1">
										<NumberInput
											placeholder="0.00"
											value={withdrawAmount}
											onChange={(e) => setWithdrawAmount(e.target.value)}
											className={cn(
												"flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums",
												withdrawValidation.error && "border-terminal-red focus:border-terminal-red",
											)}
										/>
										<Button
											variant="ghost"
											size="none"
											onClick={() => setWithdrawAmount(withdrawable)}
											className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 hover:bg-transparent"
										>
											{t`Max`}
										</Button>
									</div>
									{withdrawValidation.error && <p className="text-4xs text-terminal-red">{withdrawValidation.error}</p>}
								</div>

								<div className="rounded-md border border-border/40 bg-muted/20 p-2.5 space-y-1.5">
									<InfoRow label={<Trans>From</Trans>} value="Hyperliquid" />
									<InfoRow label={<Trans>To</Trans>} value="Arbitrum" />
									<InfoRow label={<Trans>Fee</Trans>} value={<span className="tabular-nums">${WITHDRAWAL_FEE_USD}</span>} />
									<InfoRow label={<Trans>Min</Trans>} value={<span className="tabular-nums">$1</span>} />
									<InfoRow label={<Trans>Time</Trans>} value="~3 min" />
								</div>

								<Button
									onClick={() => withdrawValidation.valid && address && startWithdraw(withdrawAmount, address)}
									disabled={!withdrawValidation.valid || isWithdrawPending}
									className="w-full"
								>
									{isWithdrawPending ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											<Trans>Processing...</Trans>
										</>
									) : (
										<Trans>Withdraw</Trans>
									)}
								</Button>
							</>
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
