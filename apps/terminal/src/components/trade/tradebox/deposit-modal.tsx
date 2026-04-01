import {
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalPopup,
	ModalTitle,
	SegmentedControlItem,
	SegmentedControls,
	Select,
} from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowLineDownIcon,
	ArrowLineUpIcon,
	ArrowSquareOutIcon,
	ArrowsLeftRightIcon,
	CheckCircleIcon,
	ClockIcon,
	SpinnerGapIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { Suspense, useState } from "react";
import { formatUnits } from "viem";
import { useConnection } from "wagmi";
import { InfoRow } from "@/components/ui/info-row";
import { NumberInput } from "@/components/ui/number-input";
import { MIN_DEPOSIT_USDC, MIN_WITHDRAW_USD, USDC_DECIMALS, WITHDRAWAL_FEE_USD } from "@/config/contracts";
import { cn } from "@/lib/cn";
import { formatTransferError } from "@/lib/errors/format";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatNumber } from "@/lib/format";
import { useDeposit, useExchange, useUserPositions } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions, useDepositModalOpen, useDepositModalTab } from "@/stores/use-global-modal-store";

const LazyBridgeTab = createLazyComponent(() => import("./bridge-tab"), "BridgeTab");

const NETWORKS = [{ id: "arbitrum", name: "Arbitrum", shortName: "ARB" }] as const;

type NetworkId = (typeof NETWORKS)[number]["id"];

interface NetworkSelectProps {
	label: React.ReactNode;
	value: NetworkId;
	onChange: (value: NetworkId) => void;
	disabled?: boolean;
}

function NetworkSelect({ label, value, onChange, disabled }: NetworkSelectProps) {
	return (
		<Select
			label={label as string}
			value={value}
			onValueChange={(v) => v && onChange(v as NetworkId)}
			disabled={disabled}
			options={NETWORKS.map((n) => ({ value: n.id, label: n.name }))}
		/>
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
		<Modal open onOpenChange={closable ? onClose : undefined}>
			<ModalPopup size="sm" showClose={closable}>
				<ModalHeader>
					<ModalTitle>{title}</ModalTitle>
				</ModalHeader>
				<ModalContent>
					<div className="flex flex-col items-center gap-4 py-6">
						{icon === "loading" ? (
							<div className="relative">
								<div className="absolute inset-0 animate-ping rounded-full bg-fill-brand-weak/20" />
								<div className="relative flex size-14 items-center justify-center rounded-full bg-fill-brand-weak/10 border border-stroke-brand-strong/30">
									<SpinnerGapIcon className="size-7 animate-spin text-text-brand" />
								</div>
							</div>
						) : (
							<div
								className={cn(
									"flex size-14 items-center justify-center rounded-full border",
									icon === "success"
										? "bg-fill-success-weak border-fill-success-weak/30"
										: "bg-fill-error-weak border-stroke-error-strong/30",
								)}
							>
								{icon === "success" ? (
									<CheckCircleIcon className="size-7 text-text-success" />
								) : (
									<WarningCircleIcon className="size-7 text-text-error" />
								)}
							</div>
						)}
						<div className="text-center space-y-1.5">
							<p className="text-sm font-medium">{heading}</p>
							{description && <p className="text-xs text-text-weak">{description}</p>}
						</div>
						{explorerUrl && (
							<a
								href={explorerUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 text-xs text-text-brand hover:underline"
							>
								<Trans>View on explorer</Trans>
								<ArrowSquareOutIcon className="size-3" />
							</a>
						)}
						{children && <div className="w-full pt-2">{children}</div>}
					</div>
				</ModalContent>
			</ModalPopup>
		</Modal>
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
		<div className="flex flex-1 flex-col gap-4">
			<NetworkSelect label={<Trans>From</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div className="space-y-1.5">
				<span className="text-xs uppercase tracking-wider text-text-strong">
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
						"w-full h-10 text-base bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums font-medium",
						validation.error && "border-stroke-error-strong focus:border-stroke-error-strong",
					)}
				/>
				<p className={cn("text-xs flex items-center gap-1", validation.error ? "text-text-error" : "invisible")}>
					<WarningCircleIcon className="size-3" />
					{validation.error || "\u00A0"}
				</p>
			</div>

			<div className="rounded-8 border border-stroke-weak/40 bg-bg-raised p-3 space-y-2 text-xs">
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<WalletIcon className="size-3" />
							<Trans>Minimum</Trans>
						</>
					}
					value={`${formatUnits(MIN_DEPOSIT_USDC, USDC_DECIMALS)} USDC`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<ClockIcon className="size-3" />
							<Trans>Estimated time</Trans>
						</>
					}
					value="~1 min"
					valueClassName="font-medium"
				/>
			</div>

			<Button
				variant="filled"
				intent="neutral"
				onClick={onSubmit}
				disabled={!validation.valid || isPending}
				className="mt-auto w-full"
			>
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
	const availableNum = toNumberOrZero(available);
	const maxWithdraw = formatNumber(Math.max(availableNum - WITHDRAWAL_FEE_USD, 0), 2);
	const amountNum = toNumber(amount);
	const netReceived = amountNum !== null && amountNum > 0 ? Math.max(amountNum - WITHDRAWAL_FEE_USD, 0) : null;

	return (
		<div className="flex flex-1 flex-col gap-4">
			<NetworkSelect label={<Trans>To</Trans>} value="arbitrum" onChange={() => {}} disabled />

			<div className="space-y-1.5">
				<span className="text-xs uppercase tracking-wider text-text-strong">
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
								{t`MAX`}: ${maxWithdraw}
							</>
						)
					}
					onMaxClick={() => !isPending && onAmountChange(maxWithdraw)}
					className={cn(
						"w-full h-10 text-base bg-bg-sunken/50 border-stroke-weak/60 focus:border-stroke-brand-strong/60 tabular-nums font-medium",
						validation.error && "border-stroke-error-strong focus:border-stroke-error-strong",
					)}
				/>
				<p className={cn("text-xs flex items-center gap-1", validation.error ? "text-text-error" : "invisible")}>
					<WarningCircleIcon className="size-3" />
					{validation.error || "\u00A0"}
				</p>
			</div>

			<div className="rounded-8 border border-stroke-weak/40 bg-bg-raised p-3 space-y-2 text-xs">
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<WalletIcon className="size-3" />
							<Trans>Network fee</Trans>
						</>
					}
					value={`$${WITHDRAWAL_FEE_USD}`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<ArrowLineDownIcon className="size-3" />
							<Trans>Net received</Trans>
						</>
					}
					value={netReceived === null ? "--" : `$${formatNumber(netReceived, 2)}`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<ArrowLineUpIcon className="size-3" />
							<Trans>Minimum</Trans>
						</>
					}
					value={`$${MIN_WITHDRAW_USD}`}
				/>
				<InfoRow
					className="p-0"
					labelClassName="flex items-center gap-1.5 text-text-strong"
					label={
						<>
							<ClockIcon className="size-3" />
							<Trans>Estimated time</Trans>
						</>
					}
					value="~5 min"
					valueClassName="font-medium"
				/>
			</div>

			<Button
				variant="filled"
				intent="neutral"
				onClick={onSubmit}
				disabled={!validation.valid || isPending}
				className="mt-auto w-full"
			>
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
			<div className="flex size-12 items-center justify-center rounded-full bg-bg-raised border border-stroke-weak/40">
				<WalletIcon className="size-6 text-text-strong" />
			</div>
			<div className="text-center space-y-1">
				<p className="text-sm font-medium">
					<Trans>Wallet not connected</Trans>
				</p>
				<p className="text-xs text-text-strong">
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
		<Modal open={open} onOpenChange={onClose}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>
						<Trans>Transfer</Trans>
					</ModalTitle>
				</ModalHeader>
				<ModalContent className="space-y-4">
					<div className="flex items-start gap-3 rounded-8 border border-fill-warning-weak/40 bg-fill-warning-weak/5 p-4">
						<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill-warning-weak/20">
							<WarningCircleIcon className="size-4 text-text-warning" />
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium">
								<Trans>Wrong network</Trans>
							</p>
							<p className="text-xs text-text-strong">
								<Trans>Switch to Arbitrum to deposit USDC to Hyperliquid</Trans>
							</p>
						</div>
					</div>
					{error && <p className="text-xs text-text-error px-1">{error.message}</p>}
					<Button variant="filled" intent="neutral" onClick={onSwitch} disabled={isSwitching} className="w-full">
						{isSwitching ? (
							<>
								<SpinnerGapIcon className="size-4 animate-spin" />
								<Trans>Switching...</Trans>
							</>
						) : (
							<Trans>Switch to Arbitrum</Trans>
						)}
					</Button>
				</ModalContent>
			</ModalPopup>
		</Modal>
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
	} = useExchange("withdraw3");

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
						<span className="tabular-nums font-medium text-text-success">{depositAmount} USDC</span>{" "}
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
					<Button variant="outline" intent="neutral" onClick={handleClose} className="flex-1">
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
						<span className="tabular-nums font-medium text-text-success">${withdrawAmount}</span>{" "}
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
					<Button variant="outline" intent="neutral" onClick={handleClose} className="flex-1">
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
		<Modal open={open} onOpenChange={handleClose}>
			<ModalPopup size="sm">
				<ModalHeader>
					<ModalTitle>
						<Trans>Transfer</Trans>
					</ModalTitle>
				</ModalHeader>

				<ModalContent className="space-y-4">
					<SegmentedControls
						value={activeTab}
						onValueChange={(v) => setTab(v as "deposit" | "withdraw" | "bridge")}
						fullWidth
					>
						<SegmentedControlItem value="deposit" icon={<ArrowLineDownIcon className="size-3" />}>
							<Trans>Deposit</Trans>
						</SegmentedControlItem>
						<SegmentedControlItem value="withdraw" icon={<ArrowLineUpIcon className="size-3" />}>
							<Trans>Withdraw</Trans>
						</SegmentedControlItem>
						<SegmentedControlItem value="bridge" icon={<ArrowsLeftRightIcon className="size-3" />}>
							<Trans>Bridge</Trans>
						</SegmentedControlItem>
					</SegmentedControls>

					<div className="min-h-95">
						{activeTab === "deposit" && (
							<div className="flex flex-col">
								<DepositForm
									amount={depositAmount}
									onAmountChange={setDepositAmount}
									balance={depositBalance}
									validation={depositValidation}
									isPending={false}
									onSubmit={handleDepositSubmit}
								/>
							</div>
						)}

						{activeTab === "withdraw" && (
							<div className="flex flex-col">
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
							</div>
						)}

						{activeTab === "bridge" && (
							<div className="flex flex-col">
								<Suspense fallback={null}>
									<LazyBridgeTab />
								</Suspense>
							</div>
						)}
					</div>
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}
