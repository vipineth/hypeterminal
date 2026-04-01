import { Badge, Button, ButtonIcon } from "@hypeterminal/ui";
import { ArrowSquareOutIcon, CopyIcon, LightningIcon, SignOutIcon, WalletIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { UI_TEXT } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { WalletDialog } from "../components/wallet-dialog";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;

interface MobileAccountViewProps {
	className?: string;
}

export function MobileAccountView({ className }: MobileAccountViewProps) {
	const { address, isConnected } = useConnection();
	const disconnect = useDisconnect();

	const { marginSummary, perpSummary, perpPositions, withdrawable, crossMaintenanceMarginUsed, isLoading } =
		useAccountBalances();

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const { copied, copy } = useCopyToClipboard();
	const { open: openDepositModal } = useDepositModalActions();

	function handleCopyAddress() {
		if (!address) return;
		copy(address);
	}

	const accountValue = toNumberOrZero(marginSummary?.accountValue);
	const totalMarginUsed = toNumberOrZero(marginSummary?.totalMarginUsed);
	const totalRawUsd = toNumberOrZero(marginSummary?.totalRawUsd);
	const crossAccountValue = toNumberOrZero(perpSummary?.accountValue);
	const crossNtlPos = toNumberOrZero(perpSummary?.totalNtlPos);
	const maintenanceMargin = toNumberOrZero(crossMaintenanceMarginUsed);
	const availableBalance = toNumberOrZero(withdrawable);
	const marginRatio = crossAccountValue > 0 ? maintenanceMargin / crossAccountValue : 0;
	const crossLeverage = crossAccountValue > 0 ? Math.abs(crossNtlPos) / crossAccountValue : 0;

	let unrealizedPnl = 0;
	for (const pos of perpPositions) {
		unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
	}

	if (!isConnected) {
		return (
			<div className={cn("flex flex-col h-full min-h-0 bg-bg-overlay/20", className)}>
				<div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
					<div className="size-20 rounded-full bg-bg-raised flex items-center justify-center">
						<WalletIcon className="size-10 text-text-weak" />
					</div>
					<div className="text-center space-y-2">
						<h2 className="text-lg font-semibold">Connect Wallet</h2>
						<p className="text-sm text-text-weak max-w-xs">
							Connect your wallet to view your account, positions, and start trading.
						</p>
					</div>
					<Button
						variant="outline"
						intent="brand"
						size="lg"
						onClick={() => setWalletDialogOpen(true)}
						className="min-h-[48px]"
					>
						Connect Wallet
					</Button>
				</div>
				<MobileBottomNavSpacer />
				<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-bg-overlay/20", className)}>
			<div className="shrink-0 px-4 py-4 border-b border-stroke-weak/60 bg-bg-overlay/30">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-full bg-fill-brand-weak flex items-center justify-center">
							<span className="text-text-brand font-bold">{address?.slice(2, 4).toUpperCase()}</span>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-mono text-sm">
									{address?.slice(0, 6)}...{address?.slice(-4)}
								</span>
								<ButtonIcon
									variant="ghost"
									intent="neutral"
									size="sm"
									onClick={handleCopyAddress}
									aria-label="Copy address"
								>
									<CopyIcon className={cn("size-3.5", copied && "text-text-success")} />
								</ButtonIcon>
							</div>
							<Badge tone="neutral" size="sm" className="mt-0.5">
								Cross Margin
							</Badge>
						</div>
					</div>
					<ButtonIcon
						variant="ghost"
						intent="error"
						size="md"
						onClick={() => disconnect.mutate()}
						aria-label="Disconnect wallet"
					>
						<SignOutIcon className="size-5" />
					</ButtonIcon>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-2 space-y-4">
					<div className="p-4 rounded-8 border border-stroke-weak/60 bg-bg-overlay/30">
						{isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
						) : (
							<>
								<div className="text-sm text-text-weak mb-1">{ACCOUNT_TEXT.EQUITY_LABEL}</div>
								<div className="text-3xl font-bold tabular-nums">{formatUSD(accountValue)}</div>
								<div
									className={cn(
										"text-sm tabular-nums mt-1",
										unrealizedPnl >= 0 ? "text-text-success" : "text-text-error",
									)}
								>
									{unrealizedPnl >= 0 ? "+" : ""}
									{formatUSD(unrealizedPnl)} {ACCOUNT_TEXT.UNREALIZED_LABEL}
								</div>
							</>
						)}
					</div>

					{/* Stats grid */}
					<div className="grid grid-cols-2 gap-3">
						<StatCard label={ACCOUNT_TEXT.BALANCE_LABEL} value={formatUSD(totalRawUsd)} isLoading={isLoading} />
						<StatCard label={ACCOUNT_TEXT.AVAILABLE_LABEL} value={formatUSD(availableBalance)} isLoading={isLoading} />
						<StatCard label={ACCOUNT_TEXT.MARGIN_USED_LABEL} value={formatUSD(totalMarginUsed)} isLoading={isLoading} />
						<StatCard
							label={ACCOUNT_TEXT.MARGIN_RATIO_LABEL}
							value={formatPercent(marginRatio)}
							valueClass={marginRatio > 0.8 ? "text-text-error" : marginRatio > 0.5 ? "text-text-warning" : ""}
							isLoading={isLoading}
						/>
						<StatCard label="Maintenance Margin" value={formatUSD(maintenanceMargin)} isLoading={isLoading} />
						<StatCard
							label={ACCOUNT_TEXT.CROSS_LEVERAGE_LABEL}
							value={`${crossLeverage.toFixed(2)}x`}
							isLoading={isLoading}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3 pt-2">
						<Button
							variant="outline"
							intent="neutral"
							size="lg"
							onClick={() => openDepositModal("deposit")}
							className="min-h-[56px] bg-fill-success-weak border-stroke-success-strong text-text-success"
							iconLeft={<LightningIcon className="size-5" />}
						>
							{ACCOUNT_TEXT.DEPOSIT_LABEL}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="lg"
							className="min-h-[56px]"
							disabled
							iconLeft={<ArrowSquareOutIcon className="size-5" />}
						>
							{ACCOUNT_TEXT.WITHDRAW_LABEL}
						</Button>
					</div>
				</div>
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}

interface StatCardProps {
	label: string;
	value: string;
	valueClass?: string;
	isLoading?: boolean;
}

function StatCard({ label, value, valueClass, isLoading }: StatCardProps) {
	return (
		<div className="p-3 rounded-8 border border-stroke-weak/40 bg-bg-overlay/20">
			<div className="text-xs text-text-weak mb-1">{label}</div>
			{isLoading ? (
				<Skeleton className="h-6 w-20" />
			) : (
				<div className={cn("text-lg font-semibold tabular-nums", valueClass)}>{value}</div>
			)}
		</div>
	);
}
