import { Badge, Button, ButtonIcon } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import {
	ArrowsLeftRightIcon,
	CopyIcon,
	DownloadSimpleIcon,
	SignOutIcon,
	UploadSimpleIcon,
	WalletIcon,
} from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useState } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { UI_TEXT } from "@/config/ui-text";
import { useDefaultDexBalances } from "@/hooks/trade/use-account-balances";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { cn } from "@/lib/cn";
import { formatPercent, formatUSD } from "@/lib/format";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { WalletModal } from "../components/wallet-modal";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;

interface MobileAccountViewProps {
	className?: string;
}

export function MobileAccountView({ className }: MobileAccountViewProps) {
	const { address, isConnected } = useConnection();
	const disconnect = useDisconnect();

	const { marginSummary, perpSummary, perpPositions, withdrawable, crossMaintenanceMarginUsed, isLoading } =
		useDefaultDexBalances();

	const [walletModalOpen, setWalletModalOpen] = useState(false);
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
			<div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
				<div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
					<div className="size-20 rounded-full bg-surface flex items-center justify-center">
						<WalletIcon className="size-10 text-fg-muted" />
					</div>
					<div className="text-center space-y-2">
						<h2 className="text-lg font-semibold">{t`Connect Wallet`}</h2>
						<p className="text-sm text-fg-muted max-w-xs">
							{t`Connect your wallet to view your account, positions, and start trading.`}
						</p>
					</div>
					<Button variant="outline" intent="brand" size="md" onClick={() => setWalletModalOpen(true)}>
						{t`Connect Wallet`}
					</Button>
				</div>
				<MobileBottomNavSpacer />
				<WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
			</div>
		);
	}

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
			<div className="shrink-0 px-4 py-4 border-b border-stroke-weak/60 bg-surface">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-full bg-brand-soft flex items-center justify-center">
							<span className="text-brand font-bold">{address?.slice(2, 4).toUpperCase()}</span>
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
									className="touch-target"
									onClick={handleCopyAddress}
									aria-label={t`Copy address`}
								>
									<CopyIcon className={cn("size-3.5", copied && "text-success")} />
								</ButtonIcon>
							</div>
							<Badge tone="neutral" size="sm" className="mt-0.5">
								{t`Cross Margin`}
							</Badge>
						</div>
					</div>
					<ButtonIcon
						variant="ghost"
						intent="error"
						size="md"
						className="touch-target"
						onClick={() => disconnect.mutate()}
						aria-label={t`Disconnect wallet`}
					>
						<SignOutIcon className="size-5" />
					</ButtonIcon>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-2 space-y-4">
					<div className="p-4 rounded-xs border border-stroke-weak/60 bg-surface">
						<Skeleton name="account-equity" loading={isLoading}>
							<div className="text-2xs uppercase font-medium text-fg-muted mb-1.5">{ACCOUNT_TEXT.EQUITY_LABEL}</div>
							<div className="text-3xl font-bold tabular-nums text-fg">{formatUSD(accountValue)}</div>
							<div
								className={cn(
									"text-sm tabular-nums mt-1.5 font-medium",
									unrealizedPnl >= 0 ? "text-success" : "text-error",
								)}
							>
								{unrealizedPnl >= 0 ? "+" : ""}
								{formatUSD(unrealizedPnl)} {ACCOUNT_TEXT.UNREALIZED_LABEL}
							</div>
						</Skeleton>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<StatCard label={ACCOUNT_TEXT.BALANCE_LABEL} value={formatUSD(totalRawUsd)} isLoading={isLoading} />
						<StatCard label={ACCOUNT_TEXT.AVAILABLE_LABEL} value={formatUSD(availableBalance)} isLoading={isLoading} />
						<StatCard label={ACCOUNT_TEXT.MARGIN_USED_LABEL} value={formatUSD(totalMarginUsed)} isLoading={isLoading} />
						<StatCard
							label={ACCOUNT_TEXT.MARGIN_RATIO_LABEL}
							value={formatPercent(marginRatio)}
							valueClass={marginRatio > 0.8 ? "text-error" : marginRatio > 0.5 ? "text-warning" : ""}
							isLoading={isLoading}
						/>
						<StatCard label={t`Maintenance Margin`} value={formatUSD(maintenanceMargin)} isLoading={isLoading} />
						<StatCard
							label={ACCOUNT_TEXT.CROSS_LEVERAGE_LABEL}
							value={`${crossLeverage.toFixed(2)}x`}
							isLoading={isLoading}
						/>
					</div>

					<div className="grid grid-cols-3 gap-2 pt-2">
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("withdraw")}
							iconLeft={<UploadSimpleIcon className="size-4" />}
						>
							{ACCOUNT_TEXT.WITHDRAW_LABEL}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("deposit")}
							iconLeft={<DownloadSimpleIcon className="size-4" />}
						>
							{ACCOUNT_TEXT.DEPOSIT_LABEL}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("bridge")}
							iconLeft={<ArrowsLeftRightIcon className="size-4" />}
						>
							{t`Bridge`}
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
		<div className="p-3 rounded-xs border border-stroke-weak/40 bg-surface">
			<div className="text-2xs text-fg-muted mb-1">{label}</div>
			<Skeleton name="stat-card-value" loading={isLoading ?? false}>
				<div className={cn("text-base font-semibold tabular-nums", valueClass)}>{value}</div>
			</Skeleton>
		</div>
	);
}
