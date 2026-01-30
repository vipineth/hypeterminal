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
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MIN_DEPOSIT_USDC, MIN_WITHDRAW_USD, USDC_DECIMALS, WITHDRAWAL_FEE_USD } from "@/config/contracts";
import { cn } from "@/lib/cn";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/format";
import { useDeposit, useExchangeWithdraw3, useSubClearinghouseState } from "@/lib/hyperliquid";
import { isPositive, parseNumber } from "@/lib/trade/numbers";
import { formatTransferError } from "@/lib/errors/format";
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
			<span className="flex items-center gap-1.5 text-muted-fg">
				{icon && <span className="text-muted-fg/60">{icon}</span>}
				{label}
			</span>
			<span className={cn(highlight && "text-fg font-medium")}>{value}</span>
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
			<span className="text-4xs uppercase tracking-wider text-muted-fg">{label}</span>
			<Select value={value} onValueChange={(v) => onChange(v as NetworkId)} disabled={disabled}>
				<SelectTrigger className="w-full h-9 bg-bg/50 border-border/60">
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
							<div className="absolute inset-0 animate-ping rounded-full bg-info/20" />
							<div className="relative flex size-14 items-center justify-center rounded-full bg-info/10 border border-info/30">
								<Loader2 className="size-7 animate-spin text-info" />
							</div>
						</div>
					) : (
						<div
							className={cn(
								"flex size-14 items-center justify-center rounded-full border",
								icon === "success" ? "bg-positive/10 border-positive/30" : "bg-negative/10 border-negative/30",
							)}
						>
							{icon === "success" ? (
								<CheckCircle2 className="size-7 text-positive" />
							) : (
								<AlertCircle className="size-7 text-negative" />
							)}
						</div>
					)}
					<div className="text-center space-y-1.5">
						<p className="text-sm font-medium">{heading}</p>
						{description && <p className="text-xs text-muted-fg">{description}</p>}
					</div>
					{explorerUrl && (
						<Button asChild variant="link" size="none" className="h-auto p-0 text-3xs text-info hover:underline">
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

interface DepositFormProps {
	amount: string;
	onAmountChange: (value: string) => void;
	balance: string;
	validation: { valid: boolean; error: string | null };
	isPending: boolean;
	onSubmit: () => void;
}

function DepositForm({ amount, onAmountChange, balance, validation, isPending, onSubmit }: DepositFormProps) {
	return (
		<div className="space-y-4">
			<NetworkSelect label={<Trans>From</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<span className="text-4xs uppercase tracking-wider text-muted-fg">
						<Trans>Amount</Trans>
					</span>
					<Button
						type="button"
						variant="link"
						size="none"
						onClick={() => onAmountChange(balance)}
						className="h-auto p-0 text-3xs text-muted-fg hover:text-fg"
					>
						<Trans>Balance:</Trans> <span className="tabular-nums text-fg font-medium">{formatNumber(balance, 2)}</span>{" "}
						<span className="text-info">USDC</span>
					</Button>
				</div>
				<div className="flex items-center gap-1">
					<NumberInput
						placeholder="0.00"
						value={amount}
						onChange={(e) => onAmountChange(e.target.value)}
						className={cn(
							"flex-1 h-10 text-base bg-bg/50 border-border/60 focus:border-info/60 tabular-nums font-medium",
							validation.error && "border-negative focus:border-negative",
						)}
					/>
					<Button
						variant="ghost"
						size="none"
						onClick={() => onAmountChange(balance)}
						className="h-10 px-3 text-3xs border border-border/60 hover:border-info/40 hover:bg-info/5 hover:text-info transition-colors"
					>
						{t`MAX`}
					</Button>
				</div>
				{validation.error && (
					<p className="text-4xs text-negative flex items-center gap-1">
						<AlertCircle className="size-3" />
						{validation.error}
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

			<Button variant="terminal" onClick={onSubmit} disabled={!validation.valid || isPending} className="w-full">
				{isPending ? (
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
		</div>
	);
}

interface WithdrawFormProps {
	amount: string;
	onAmountChange: (value: string) => void;
	available: string;
	balanceStatus: string;
	validation: { valid: boolean; error: string | null };
	isPending: boolean;
	onSubmit: () => void;
}

function WithdrawForm({
	amount,
	onAmountChange,
	available,
	balanceStatus,
	validation,
	isPending,
	onSubmit,
}: WithdrawFormProps) {
	return (
		<div className="space-y-4">
			<NetworkSelect label={<Trans>To</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<span className="text-4xs uppercase tracking-wider text-muted-fg">
						<Trans>Amount</Trans>
					</span>
					<Button
						type="button"
						variant="link"
						size="none"
						onClick={() => !isPending && onAmountChange(available)}
						disabled={isPending}
						className="h-auto p-0 text-3xs text-muted-fg hover:text-fg disabled:opacity-50"
					>
						{balanceStatus === "subscribing" ? (
							<Trans>Loading...</Trans>
						) : (
							<>
								<Trans>Available:</Trans>{" "}
								<span className="tabular-nums text-fg font-medium">${formatNumber(available, 2)}</span>
							</>
						)}
					</Button>
				</div>
				<div className="flex items-center gap-1">
					<NumberInput
						placeholder="0.00"
						value={amount}
						onChange={(e) => onAmountChange(e.target.value)}
						disabled={isPending}
						className={cn(
							"flex-1 h-10 text-base bg-bg/50 border-border/60 focus:border-info/60 tabular-nums font-medium",
							validation.error && "border-negative focus:border-negative",
						)}
					/>
					<Button
						variant="ghost"
						size="none"
						onClick={() => !isPending && onAmountChange(available)}
						disabled={isPending}
						className="h-10 px-3 text-3xs border border-border/60 hover:border-info/40 hover:bg-info/5 hover:text-info transition-colors disabled:opacity-50"
					>
						{t`MAX`}
					</Button>
				</div>
				{validation.error && (
					<p className="text-4xs text-negative flex items-center gap-1">
						<AlertCircle className="size-3" />
						{validation.error}
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

			<Button variant="terminal" onClick={onSubmit} disabled={!validation.valid || isPending} className="w-full">
				{isPending ? (
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
		</div>
	);
}

function WalletNotConnected() {
	return (
		<div className="flex flex-col items-center gap-4 py-8">
			<div className="flex size-12 items-center justify-center rounded-full bg-muted/30 border border-border/40">
				<Wallet className="size-6 text-muted-fg" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>Wallet not connected</Trans>
				</p>
				<p className="text-3xs text-muted-fg">
					<Trans>Connect your wallet to withdraw funds</Trans>
				</p>
			</div>
		</div>
	);
}

interface WrongNetworkScreenProps {
	open: boolean;
	onClose: () => void;
	onSwitch: () => void;
	isSwitching: boolean;
	error?: Error | null;
}

function WrongNetworkScreen({ open, onClose, onSwitch, isSwitching, error }: WrongNetworkScreenProps) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Transfer</Trans>
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/20">
							<AlertCircle className="size-4 text-warning" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">
								<Trans>Wrong network</Trans>
							</p>
							<p className="text-3xs text-muted-fg">
								<Trans>Switch to Arbitrum to deposit USDC to Hyperliquid</Trans>
							</p>
						</div>
					</div>
					{error && <p className="text-3xs text-negative px-1">{error.message}</p>}
					<Button onClick={onSwitch} disabled={isSwitching} className="w-full">
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

export function DepositModal() {
	const open = useDepositModalOpen();
	const activeTab = useDepositModalTab();
	const { close, setTab } = useDepositModalActions();

	const [depositAmount, setDepositAmount] = useState("");
	const [withdrawAmount, setWithdrawAmount] = useState("");

	const {
		isArbitrum,
		switchToArbitrum,
		isSwitching,
		switchError,
		balance: depositBalance,
		status: depositStatus,
		error: depositError,
		hash: depositHash,
		deposit,
		validate: validateDeposit,
		reset: resetDeposit,
	} = useDeposit();

	const { address } = useConnection();

	const { data: clearinghouse, status: balanceStatus } = useSubClearinghouseState(
		{ user: address ?? "0x" },
		{ enabled: !!address },
	);

	const withdrawable = clearinghouse?.clearinghouseState?.withdrawable ?? "0";
	const withdrawableNum = parseNumber(withdrawable);

	const {
		mutate: withdraw,
		isPending: isWithdrawPending,
		isSuccess: isWithdrawSuccess,
		error: withdrawError,
		reset: resetWithdraw,
	} = useExchangeWithdraw3();

	const depositValidation = validateDeposit(depositAmount);

	function validateWithdraw(amount: string) {
		if (!amount || amount === "0") return { valid: false, error: null };
		const amountNum = parseNumber(amount);
		if (!isPositive(amountNum)) return { valid: false, error: t`Invalid amount` };
		if (amountNum < MIN_WITHDRAW_USD) return { valid: false, error: t`Minimum withdrawal is $${MIN_WITHDRAW_USD}` };
		if (amountNum > withdrawableNum) return { valid: false, error: t`Insufficient balance` };
		return { valid: true, error: null };
	}

	const withdrawValidation = validateWithdraw(withdrawAmount);

	function handleClose() {
		resetDeposit();
		resetWithdraw();
		setDepositAmount("");
		setWithdrawAmount("");
		close();
	}

	function handleDepositSubmit() {
		if (depositValidation.valid) {
			deposit(depositAmount);
		}
	}

	function handleWithdrawSubmit() {
		if (withdrawValidation.valid && address) {
			withdraw({ destination: address, amount: withdrawAmount });
		}
	}

	// Wrong network state
	if (!isArbitrum && activeTab === "deposit") {
		return (
			<WrongNetworkScreen
				open={open}
				onClose={handleClose}
				onSwitch={switchToArbitrum}
				isSwitching={isSwitching}
				error={switchError}
			/>
		);
	}

	// Deposit status screens
	if (depositStatus === "success") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="success"
				heading={<Trans>Deposit complete</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-positive">{depositAmount} USDC</span>{" "}
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

	if (depositStatus === "error") {
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

	if (depositStatus === "pending" || depositStatus === "confirming") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="loading"
				heading={depositStatus === "pending" ? <Trans>Confirm in wallet</Trans> : <Trans>Processing deposit</Trans>}
				description={<span className="tabular-nums">{depositAmount} USDC → Hyperliquid</span>}
				txHash={depositStatus === "confirming" ? depositHash : undefined}
				closable={false}
			/>
		);
	}

	// Withdraw status screens
	if (isWithdrawSuccess) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="success"
				heading={<Trans>Withdrawal submitted</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-positive">${withdrawAmount}</span>{" "}
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

	// Main form
	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						<Trans>Transfer</Trans>
					</DialogTitle>
				</DialogHeader>

				<Tabs value={activeTab} onValueChange={(v) => setTab(v as "deposit" | "withdraw")} className="space-y-4">
					<TabsList className="w-full grid grid-cols-2 p-1 bg-muted/30 rounded-lg border border-border/40">
						<TabsTrigger
							value="deposit"
							className={cn(
								"flex items-center justify-center gap-1.5 py-2 rounded-md text-3xs font-medium transition-all",
								activeTab === "deposit"
									? "bg-bg text-info shadow-sm border border-border/60"
									: "text-muted-fg hover:text-fg",
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
									? "bg-bg text-info shadow-sm border border-border/60"
									: "text-muted-fg hover:text-fg",
							)}
						>
							<ArrowUpFromLine className="size-3" />
							<Trans>Withdraw</Trans>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="deposit">
						<DepositForm
							amount={depositAmount}
							onAmountChange={setDepositAmount}
							balance={depositBalance}
							validation={depositValidation}
							isPending={depositStatus === "pending"}
							onSubmit={handleDepositSubmit}
						/>
					</TabsContent>

					<TabsContent value="withdraw">
						{!address ? (
							<WalletNotConnected />
						) : (
							<WithdrawForm
								amount={withdrawAmount}
								onAmountChange={setWithdrawAmount}
								available={withdrawable}
								balanceStatus={balanceStatus}
								validation={withdrawValidation}
								isPending={isWithdrawPending}
								onSubmit={handleWithdrawSubmit}
							/>
						)}
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
