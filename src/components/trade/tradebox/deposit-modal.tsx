import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowLineDownIcon,
	ArrowLineUpIcon,
	ArrowSquareOutIcon,
	CheckCircleIcon,
	ClockIcon,
	SpinnerGapIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
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
import { formatTransferError } from "@/lib/errors/format";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/format";
import { useDeposit, useExchangeWithdraw3, useUserPositions } from "@/lib/hyperliquid";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions, useDepositModalOpen, useDepositModalTab } from "@/stores/use-global-modal-store";

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
			<span className="flex items-center gap-1.5 text-text-600">
				{icon && <span className="text-text-400">{icon}</span>}
				{label}
			</span>
			<span className={cn(highlight && "text-text-950 font-medium")}>{value}</span>
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
			<span className="text-4xs uppercase tracking-wider text-text-600">{label}</span>
			<Select value={value} onValueChange={(v) => onChange(v as NetworkId)} disabled={disabled}>
				<SelectTrigger className="w-full h-9 bg-surface-base/50 border-border-200/60">
					<SelectValue>
						<span className="flex items-center gap-2">
							<span className="flex size-5 items-center justify-center rounded bg-surface-analysis text-4xs font-medium">
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
								<span className="flex size-5 items-center justify-center rounded bg-surface-analysis text-4xs font-medium">
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
							<div className="absolute inset-0 animate-ping rounded-full bg-primary-default/20" />
							<div className="relative flex size-14 items-center justify-center rounded-full bg-primary-default/10 border border-primary-default/30">
								<SpinnerGapIcon className="size-7 animate-spin text-primary-default" />
							</div>
						</div>
					) : (
						<div
							className={cn(
								"flex size-14 items-center justify-center rounded-full border",
								icon === "success"
									? "bg-market-up-100 border-market-up-600/30"
									: "bg-market-down-100 border-market-down-600/30",
							)}
						>
							{icon === "success" ? (
								<CheckCircleIcon className="size-7 text-market-up-600" />
							) : (
								<WarningCircleIcon className="size-7 text-market-down-600" />
							)}
						</div>
					)}
					<div className="text-center space-y-1.5">
						<p className="text-sm font-medium">{heading}</p>
						{description && <p className="text-xs text-text-600">{description}</p>}
					</div>
					{explorerUrl && (
						<Button
							asChild
							variant="text"
							size="none"
							className="h-auto p-0 text-3xs text-primary-default hover:underline"
						>
							<a href={explorerUrl} target="_blank" rel="noopener noreferrer">
								<span className="inline-flex items-center gap-1.5">
									<Trans>View on explorer</Trans>
									<ArrowSquareOutIcon className="size-3" />
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
				<span className="text-4xs uppercase tracking-wider text-text-600">
					<Trans>Amount</Trans>
				</span>
				<NumberInput
					placeholder="0.00"
					value={amount}
					onChange={(e) => onAmountChange(e.target.value)}
					maxLabel={
						<>
							{t`MAX`}: {formatNumber(balance, 2)}
						</>
					}
					onMaxClick={() => onAmountChange(balance)}
					className={cn(
						"w-full h-10 text-base bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums font-medium",
						validation.error && "border-market-down-600 focus:border-market-down-600",
					)}
				/>
				{validation.error && (
					<p className="text-4xs text-market-down-600 flex items-center gap-1">
						<WarningCircleIcon className="size-3" />
						{validation.error}
					</p>
				)}
			</div>

			<div className="rounded-xs border border-border-200/40 bg-surface-analysis p-3 space-y-2">
				<InfoRow
					label={<Trans>Minimum</Trans>}
					value={<span className="tabular-nums">{formatUnits(MIN_DEPOSIT_USDC, USDC_DECIMALS)} USDC</span>}
					icon={<WalletIcon className="size-3" />}
				/>
				<InfoRow
					label={<Trans>Estimated time</Trans>}
					value={<span className="tabular-nums">~1 min</span>}
					icon={<ClockIcon className="size-3" />}
					highlight
				/>
			</div>

			<Button variant="contained" onClick={onSubmit} disabled={!validation.valid || isPending} className="w-full">
				{isPending ? (
					<>
						<SpinnerGapIcon className="size-4 animate-spin" />
						<Trans>Processing...</Trans>
					</>
				) : (
					<>
						<ArrowLineDownIcon className="size-4" />
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
	const amountNum = toNumber(amount);
	const netReceived = amountNum !== null && amountNum > 0 ? Math.max(amountNum - WITHDRAWAL_FEE_USD, 0) : null;

	return (
		<div className="space-y-4">
			<NetworkSelect label={<Trans>To</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div className="space-y-1.5">
				<span className="text-4xs uppercase tracking-wider text-text-600">
					<Trans>Amount</Trans>
				</span>
				<NumberInput
					placeholder="0.00"
					value={amount}
					onChange={(e) => onAmountChange(e.target.value)}
					disabled={isPending}
					maxLabel={
						balanceStatus === "subscribing" ? (
							<Trans>Loading...</Trans>
						) : (
							<>
								{t`MAX`}: ${formatNumber(available, 2)}
							</>
						)
					}
					onMaxClick={() => !isPending && onAmountChange(available)}
					className={cn(
						"w-full h-10 text-base bg-surface-base/50 border-border-200/60 focus:border-primary-default/60 tabular-nums font-medium",
						validation.error && "border-market-down-600 focus:border-market-down-600",
					)}
				/>
				{validation.error && (
					<p className="text-4xs text-market-down-600 flex items-center gap-1">
						<WarningCircleIcon className="size-3" />
						{validation.error}
					</p>
				)}
			</div>

			<div className="rounded-xs border border-border-200/40 bg-surface-analysis p-3 space-y-2">
				<InfoRow
					label={<Trans>Network fee</Trans>}
					value={<span className="tabular-nums">${WITHDRAWAL_FEE_USD}</span>}
					icon={<WalletIcon className="size-3" />}
				/>
				<InfoRow
					label={<Trans>Net received</Trans>}
					value={
						netReceived === null ? (
							<span className="tabular-nums text-text-600">--</span>
						) : (
							<span className="tabular-nums">${formatNumber(netReceived, 2)}</span>
						)
					}
					icon={<ArrowLineDownIcon className="size-3" />}
				/>
				<InfoRow
					label={<Trans>Minimum</Trans>}
					value={<span className="tabular-nums">${MIN_WITHDRAW_USD}</span>}
					icon={<ArrowLineUpIcon className="size-3" />}
				/>
				<InfoRow
					label={<Trans>Estimated time</Trans>}
					value={<span className="tabular-nums">~5 min</span>}
					icon={<ClockIcon className="size-3" />}
					highlight
				/>
			</div>

			<Button variant="contained" onClick={onSubmit} disabled={!validation.valid || isPending} className="w-full">
				{isPending ? (
					<>
						<SpinnerGapIcon className="size-4 animate-spin" />
						<Trans>Processing...</Trans>
					</>
				) : (
					<>
						<ArrowLineUpIcon className="size-4" />
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
			<div className="flex size-12 items-center justify-center rounded-full bg-surface-analysis border border-border-200/40">
				<WalletIcon className="size-6 text-text-600" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>Wallet not connected</Trans>
				</p>
				<p className="text-3xs text-text-600">
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
					<div className="flex items-start gap-3 rounded-xs border border-warning-700/40 bg-warning-700/5 p-4">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-700/20">
							<WarningCircleIcon className="size-4 text-warning-700" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">
								<Trans>Wrong network</Trans>
							</p>
							<p className="text-3xs text-text-600">
								<Trans>Switch to Arbitrum to deposit USDC to Hyperliquid</Trans>
							</p>
						</div>
					</div>
					{error && <p className="text-3xs text-market-down-600 px-1">{error.message}</p>}
					<Button onClick={onSwitch} disabled={isSwitching} className="w-full">
						{isSwitching ? (
							<>
								<SpinnerGapIcon className="size-4 animate-spin" />
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

	const userPositions = useUserPositions();
	const balanceStatus = userPositions.isLoading ? "subscribing" : "active";

	const withdrawable = userPositions.withdrawable;
	const withdrawableNum = toNumberOrZero(withdrawable);

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
		const amountNum = toNumber(amount);
		if (amountNum === null || amountNum <= 0) return { valid: false, error: t`Invalid amount` };
		if (amountNum < MIN_WITHDRAW_USD) return { valid: false, error: t`Minimum withdrawal is $${MIN_WITHDRAW_USD}` };
		if (amountNum + WITHDRAWAL_FEE_USD > withdrawableNum)
			return { valid: false, error: t`Insufficient balance (includes $${WITHDRAWAL_FEE_USD} fee)` };
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
						<span className="tabular-nums font-medium text-market-up-600">{depositAmount} USDC</span>{" "}
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
					<Button variant="outlined" onClick={handleClose} className="flex-1">
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
						<span className="tabular-nums font-medium text-market-up-600">${withdrawAmount}</span>{" "}
						<Trans>will arrive in ~5 min</Trans>
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
					<Button variant="outlined" onClick={handleClose} className="flex-1">
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
					<TabsList variant="pill" className="w-full grid grid-cols-2">
						<TabsTrigger value="deposit">
							<ArrowLineDownIcon className="size-3" />
							<Trans>Deposit</Trans>
						</TabsTrigger>
						<TabsTrigger value="withdraw">
							<ArrowLineUpIcon className="size-3" />
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
