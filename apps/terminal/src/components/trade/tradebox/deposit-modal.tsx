import {
	Button,
	Modal,
	ModalContent,
	ModalHeader,
	ModalPopup,
	ModalTitle,
	SegmentedControlItem,
	SegmentedControls,
} from "@hypeterminal/ui";
import { Trans } from "@lingui/react/macro";
import { ArrowLineDownIcon, ArrowLineUpIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { Suspense, useState } from "react";
import { useConnection } from "wagmi";
import { NETWORKS } from "@/config/networks";
import { getNormalizedWithdrawable } from "@/domain/trade/balances";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { formatTransferError } from "@/lib/errors/format";
import { useDeposit, useExchange } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { validateWithdraw } from "@/lib/trade/withdraw-validation";
import { useDepositModalActions, useDepositModalOpen, useDepositModalTab } from "@/stores/use-global-modal-store";
import { DepositForm } from "./deposit/deposit-form";
import { StatusScreen, WalletNotConnected } from "./deposit/shared-ui";
import { WithdrawForm } from "./deposit/withdraw-form";
import { WrongNetworkScreen } from "./deposit/wrong-network-screen";

const LazyBridgeTab = createLazyComponent(() => import("./bridge/bridge-tab"), "BridgeTab");

const ARBITRUM_NETWORK = NETWORKS[0];

const DEPOSIT_TAB_MIN_HEIGHT = "min-h-72";

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

	const {
		withdrawable: rawWithdrawable,
		spotBalances,
		spotAvailableAfterMaintenance,
		accountAbstraction,
	} = useDefaultDexBalances();
	const withdrawable = getNormalizedWithdrawable(
		rawWithdrawable,
		spotBalances,
		spotAvailableAfterMaintenance,
		accountAbstraction,
	);
	const withdrawableNum = toNumberOrZero(withdrawable);

	const {
		mutate: withdraw,
		isPending: isWithdrawPending,
		isSuccess: isWithdrawSuccess,
		error: withdrawError,
		reset: resetWithdraw,
	} = useExchange("withdraw3");

	const depositValidation = validateDeposit(depositAmount);
	const withdrawValidation = validateWithdraw(withdrawAmount, withdrawableNum);

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

	if (depositStatus === "success") {
		return (
			<StatusScreen
				title={<Trans>Deposit</Trans>}
				icon="success"
				heading={<Trans>Deposit complete</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-success">{depositAmount} USDC</span>{" "}
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

	if (isWithdrawSuccess) {
		return (
			<StatusScreen
				title={<Trans>Withdraw</Trans>}
				icon="success"
				heading={<Trans>Withdrawal submitted</Trans>}
				description={
					<>
						<span className="tabular-nums font-medium text-success">${withdrawAmount}</span>{" "}
						<Trans>will arrive in {ARBITRUM_NETWORK.estimatedWithdrawTime}</Trans>
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

					<div className={`flex flex-col ${DEPOSIT_TAB_MIN_HEIGHT}`}>
						{activeTab === "deposit" && (
							<DepositForm
								amount={depositAmount}
								onAmountChange={setDepositAmount}
								balance={depositBalance}
								validation={depositValidation}
								isPending={false}
								onSubmit={handleDepositSubmit}
							/>
						)}

						{activeTab === "withdraw" &&
							(!address ? (
								<WalletNotConnected />
							) : (
								<WithdrawForm
									amount={withdrawAmount}
									onAmountChange={setWithdrawAmount}
									available={withdrawable}
									validation={withdrawValidation}
									isPending={isWithdrawPending}
									onSubmit={handleWithdrawSubmit}
								/>
							))}

						{activeTab === "bridge" && (
							<Suspense fallback={null}>
								<LazyBridgeTab />
							</Suspense>
						)}
					</div>
				</ModalContent>
			</ModalPopup>
		</Modal>
	);
}
