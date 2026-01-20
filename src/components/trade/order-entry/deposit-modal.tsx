import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	AlertCircle,
	ArrowDownToLine,
	ArrowUpFromLine,
	CheckCircle2,
	Clock,
	ExternalLink,
	Loader2,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MIN_DEPOSIT_USDC, MIN_WITHDRAW_USD, USDC_DECIMALS, WITHDRAWAL_FEE_USD } from "@/config/contracts";
import { useArbitrumDeposit } from "@/hooks/arbitrum/use-arbitrum-deposit";
import { useHyperliquidWithdraw } from "@/hooks/arbitrum/use-hyperliquid-withdraw";
import { cn } from "@/lib/cn";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/format";
import { formatTransferError } from "@/lib/transfer/errors";
import { useDepositModalActions, useDepositModalOpen, useDepositModalTab } from "@/stores/use-deposit-modal-store";

const NETWORKS = [{ id: "arbitrum", name: "Arbitrum", shortName: "ARB" }] as const;

type NetworkId = (typeof NETWORKS)[number]["id"];

interface InfoRowProps {
	label: React.ReactNode;
	value: React.ReactNode;
	icon?: React.ReactNode;
	highlight?: boolean;
}

function InfoRow({ label, value, icon, highlight }: InfoRowProps) {
	return (
		<div className="flex items-center justify-between text-3xs">
			<span className="flex items-center gap-1.5 text-muted-foreground">
				{icon && <span className="text-muted-foreground/60">{icon}</span>}
				{label}
			</span>
			<span className={cn(highlight && "text-foreground font-medium")}>{value}</span>
		</div>
	);
}

interface NetworkSelectProps {
	label: React.ReactNode;
	value: NetworkId;
	onChange: (value: NetworkId) => void;
	disabled?: boolean;
}

function NetworkSelect({ label, value, onChange, disabled }: NetworkSelectProps) {
	const selectedNetwork = NETWORKS.find((n) => n.id === value) ?? NETWORKS[0];

	return (
		<div className="space-y-1.5">
			<span className="text-4xs uppercase tracking-wider text-muted-foreground">{label}</span>
			<Select value={value} onValueChange={(v) => onChange(v as NetworkId)} disabled={disabled}>
				<SelectTrigger className="w-full h-9 bg-background/50 border-border/60">
					<SelectValue>
						<span className="flex items-center gap-2">
							<span className="flex size-5 items-center justify-center rounded bg-muted/50 text-4xs font-medium">
								{selectedNetwork.shortName}
							</span>
							<span>{selectedNetwork.name}</span>
						</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{NETWORKS.map((network) => (
						<SelectItem key={network.id} value={network.id}>
							<span className="flex items-center gap-2">
								<span className="flex size-5 items-center justify-center rounded bg-muted/50 text-4xs font-medium">
									{network.shortName}
								</span>
								<span>{network.name}</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
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

function StatusScreen({
	title,
	icon,
	heading,
	description,
	txHash,
	children,
	onClose,
	closable = true,
}: StatusScreenProps) {
	const explorerUrl = txHash ? getExplorerTxUrl(txHash) : null;

	return (
		<Dialog open onOpenChange={closable ? onClose : undefined}>
			<DialogContent className="sm:max-w-md" showCloseButton={closable}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col items-center gap-4 py-6">
					{icon === "loading" ? (
						<div className="relative">
							<div className="absolute inset-0 animate-ping rounded-full bg-terminal-cyan/20" />
							<div className="relative flex size-14 items-center justify-center rounded-full bg-terminal-cyan/10 border border-terminal-cyan/30">
								<Loader2 className="size-7 animate-spin text-terminal-cyan" />
							</div>
						</div>
					) : (
						<div
							className={cn(
								"flex size-14 items-center justify-center rounded-full border",
								icon === "success"
									? "bg-terminal-green/10 border-terminal-green/30"
									: "bg-terminal-red/10 border-terminal-red/30",
							)}
						>
							{icon === "success" ? (
								<CheckCircle2 className="size-7 text-terminal-green" />
							) : (
								<AlertCircle className="size-7 text-terminal-red" />
							)}
						</div>
					)}
					<div className="text-center space-y-1.5">
						<p className="text-sm font-medium">{heading}</p>
						{description && <p className="text-xs text-muted-foreground">{description}</p>}
					</div>
					{explorerUrl && (
						<Button
							asChild
							variant="link"
							size="none"
							className="h-auto p-0 text-3xs text-terminal-cyan hover:underline"
						>
							<a href={explorerUrl} target="_blank" rel="noopener noreferrer">
								<span className="inline-flex items-center gap-1.5">
									<Trans>View on explorer</Trans>
									<ExternalLink className="size-3" />
								</span>
							</a>
						</Button>
					)}
					{children && <div className="w-full pt-2">{children}</div>}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function DepositModal() {
	const open = useDepositModalOpen();
	const activeTab = useDepositModalTab();
	const { close, setTab } = useDepositModalActions();

	const [depositAmount, setDepositAmount] = useState("");
	const [withdrawAmount, setWithdrawAmount] = useState("");
	const [depositNetwork, setDepositNetwork] = useState<NetworkId>("arbitrum");
	const [withdrawNetwork, setWithdrawNetwork] = useState<NetworkId>("arbitrum");

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

	function handleDepositAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
		setDepositAmount(event.target.value);
	}

	function handleWithdrawAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
		setWithdrawAmount(event.target.value);
	}

	function handleTabChange(tab: "deposit" | "withdraw") {
		setTab(tab);
	}

	function handleSetDepositMax() {
		setDepositAmount(depositBalance);
	}

	function handleSetWithdrawMax() {
		if (isWithdrawPending) {
			return;
		}

		setWithdrawAmount(withdrawable);
	}

	function handleDepositSubmit() {
		if (!depositValidation.valid) {
			return;
		}

		startDeposit(depositAmount);
	}

	function handleWithdrawSubmit() {
		if (!withdrawValidation.valid || !address) {
			return;
		}

		startWithdraw(withdrawAmount, address);
	}

	function handleClose() {
		resetDeposit();
		resetWithdraw();
		setDepositAmount("");
		setWithdrawAmount("");
		close();
	}

	if (!isArbitrum && activeTab === "deposit") {
		return (
			<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							<Trans>Transfer</Trans>
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="flex items-start gap-3 rounded-lg border border-terminal-amber/40 bg-terminal-amber/5 p-4">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-terminal-amber/20">
								<AlertCircle className="size-4 text-terminal-amber" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium">
									<Trans>Wrong network</Trans>
								</p>
								<p className="text-3xs text-muted-foreground">
									<Trans>Switch to Arbitrum to deposit USDC to Hyperliquid</Trans>
								</p>
							</div>
						</div>
						{switchError && <p className="text-3xs text-terminal-red px-1">{switchError.message}</p>}
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

	if (depositStep === "success") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="success"
				heading={<Trans>Deposit complete</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-terminal-green">{depositAmount} USDC</span>{" "}
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

	if (depositStep === "error") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="error"
				heading={<Trans>Deposit failed</Trans>}
				description={formatTransferError(depositError)}
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

	if (depositStep === "signing" || depositStep === "depositing") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="loading"
				heading={depositStep === "signing" ? <Trans>Confirm in wallet</Trans> : <Trans>Processing deposit</Trans>}
				description={<span className="tabular-nums">{depositAmount} USDC → Hyperliquid</span>}
				txHash={depositStep === "depositing" ? depositHash : undefined}
				closable={false}
			/>
		);
	}

	if (isWithdrawSuccess) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="success"
				heading={<Trans>Withdrawal submitted</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-terminal-green">${withdrawAmount}</span>{" "}
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

	if (withdrawError) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="error"
				heading={<Trans>Withdrawal failed</Trans>}
				description={formatTransferError(withdrawError)}
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

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Transfer</Trans>
					</DialogTitle>
				</DialogHeader>

				<Tabs
					value={activeTab}
					onValueChange={(v) => handleTabChange(v as "deposit" | "withdraw")}
					className="space-y-4"
				>
					<TabsList className="w-full grid grid-cols-2 p-1 bg-muted/30 rounded-lg border border-border/40">
						<TabsTrigger
							value="deposit"
							className={cn(
								"flex items-center justify-center gap-1.5 py-2 rounded-md text-3xs font-medium transition-all",
								activeTab === "deposit"
									? "bg-background text-terminal-cyan shadow-sm border border-border/60"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<ArrowDownToLine className="size-3" />
							<Trans>Deposit</Trans>
						</TabsTrigger>
						<TabsTrigger
							value="withdraw"
							className={cn(
								"flex items-center justify-center gap-1.5 py-2 rounded-md text-3xs font-medium transition-all",
								activeTab === "withdraw"
									? "bg-background text-terminal-cyan shadow-sm border border-border/60"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<ArrowUpFromLine className="size-3" />
							<Trans>Withdraw</Trans>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="deposit" className="space-y-4">
						<NetworkSelect label={<Trans>From</Trans>} value={depositNetwork} onChange={setDepositNetwork} />

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-4xs uppercase tracking-wider text-muted-foreground">
									<Trans>Amount</Trans>
								</span>
								<Button
									type="button"
									variant="link"
									size="none"
									onClick={handleSetDepositMax}
									className="h-auto p-0 text-3xs text-muted-foreground hover:text-foreground"
								>
									<Trans>Balance:</Trans>{" "}
									<span className="tabular-nums text-foreground font-medium">{formatNumber(depositBalance, 2)}</span>{" "}
									<span className="text-terminal-cyan">USDC</span>
								</Button>
							</div>
							<div className="flex items-center gap-1">
								<NumberInput
									placeholder="0.00"
									value={depositAmount}
									onChange={handleDepositAmountChange}
									className={cn(
										"flex-1 h-10 text-base bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums font-medium",
										depositValidation.error && "border-terminal-red focus:border-terminal-red",
									)}
								/>
								<Button
									variant="ghost"
									size="none"
									onClick={handleSetDepositMax}
									className="h-10 px-3 text-3xs border border-border/60 hover:border-terminal-cyan/40 hover:bg-terminal-cyan/5 hover:text-terminal-cyan transition-colors"
								>
									{t`MAX`}
								</Button>
							</div>
							{depositValidation.error && (
								<p className="text-4xs text-terminal-red flex items-center gap-1">
									<AlertCircle className="size-3" />
									{depositValidation.error}
								</p>
							)}
						</div>

						<div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-2">
							<InfoRow
								label={<Trans>Minimum</Trans>}
								value={<span className="tabular-nums">{formatUnits(MIN_DEPOSIT_USDC, USDC_DECIMALS)} USDC</span>}
								icon={<Wallet className="size-3" />}
							/>
							<InfoRow
								label={<Trans>Estimated time</Trans>}
								value={<span className="tabular-nums">~1 min</span>}
								icon={<Clock className="size-3" />}
								highlight
							/>
						</div>

						<Button
							variant="terminal"
							onClick={handleDepositSubmit}
							disabled={!depositValidation.valid || isDepositPending}
							className="w-full"
						>
							{isDepositPending ? (
								<>
									<Loader2 className="size-4 animate-spin" />
									<Trans>Processing...</Trans>
								</>
							) : (
								<>
									<ArrowDownToLine className="size-4" />
									<Trans>Deposit</Trans>
								</>
							)}
						</Button>
					</TabsContent>

					<TabsContent value="withdraw" className="space-y-4">
						{!address ? (
							<div className="flex flex-col items-center gap-4 py-8">
								<div className="flex size-12 items-center justify-center rounded-full bg-muted/30 border border-border/40">
									<Wallet className="size-6 text-muted-foreground" />
								</div>
								<div className="text-center space-y-1">
									<p className="text-sm font-medium">
										<Trans>Wallet not connected</Trans>
									</p>
									<p className="text-3xs text-muted-foreground">
										<Trans>Connect your wallet to withdraw funds</Trans>
									</p>
								</div>
							</div>
						) : (
							<>
								<NetworkSelect
									label={<Trans>To</Trans>}
									value={withdrawNetwork}
									onChange={setWithdrawNetwork}
									disabled={isWithdrawPending}
								/>

								<div className="space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-4xs uppercase tracking-wider text-muted-foreground">
											<Trans>Amount</Trans>
										</span>
										<Button
											type="button"
											variant="link"
											size="none"
											onClick={handleSetWithdrawMax}
											disabled={isWithdrawPending}
											className="h-auto p-0 text-3xs text-muted-foreground hover:text-foreground disabled:opacity-50"
										>
											{balanceStatus === "subscribing" ? (
												<Trans>Loading...</Trans>
											) : (
												<>
													<Trans>Available:</Trans>{" "}
													<span className="tabular-nums text-foreground font-medium">
														${formatNumber(withdrawable, 2)}
													</span>
												</>
											)}
										</Button>
									</div>
									<div className="flex items-center gap-1">
										<NumberInput
											placeholder="0.00"
											value={withdrawAmount}
											onChange={handleWithdrawAmountChange}
											disabled={isWithdrawPending}
											className={cn(
												"flex-1 h-10 text-base bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums font-medium",
												withdrawValidation.error && "border-terminal-red focus:border-terminal-red",
											)}
										/>
										<Button
											variant="ghost"
											size="none"
											onClick={handleSetWithdrawMax}
											disabled={isWithdrawPending}
											className="h-10 px-3 text-3xs border border-border/60 hover:border-terminal-cyan/40 hover:bg-terminal-cyan/5 hover:text-terminal-cyan transition-colors disabled:opacity-50"
										>
											{t`MAX`}
										</Button>
									</div>
									{withdrawValidation.error && (
										<p className="text-4xs text-terminal-red flex items-center gap-1">
											<AlertCircle className="size-3" />
											{withdrawValidation.error}
										</p>
									)}
								</div>

								<div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-2">
									<InfoRow
										label={<Trans>Network fee</Trans>}
										value={<span className="tabular-nums">${WITHDRAWAL_FEE_USD}</span>}
										icon={<Wallet className="size-3" />}
									/>
									<InfoRow
										label={<Trans>Minimum</Trans>}
										value={<span className="tabular-nums">${MIN_WITHDRAW_USD}</span>}
										icon={<ArrowUpFromLine className="size-3" />}
									/>
									<InfoRow
										label={<Trans>Estimated time</Trans>}
										value={<span className="tabular-nums">~3 min</span>}
										icon={<Clock className="size-3" />}
										highlight
									/>
								</div>

								<Button
									variant="terminal"
									onClick={handleWithdrawSubmit}
									disabled={!withdrawValidation.valid || isWithdrawPending}
									className="w-full"
								>
									{isWithdrawPending ? (
										<>
											<Loader2 className="size-4 animate-spin" />
											<Trans>Processing...</Trans>
										</>
									) : (
										<>
											<ArrowUpFromLine className="size-4" />
											<Trans>Withdraw</Trans>
										</>
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
