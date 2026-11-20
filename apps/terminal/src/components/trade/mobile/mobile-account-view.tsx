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
import { useConnection } from "wagmi";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/app";
import { UI_TEXT } from "@/config/ui-text";
import { getAccountSummary, type PerpsOverview } from "@/domain/trade/balances";
import { useAccountState } from "@/hooks/trade/use-account-balances";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { useDisconnectWallet } from "@/hooks/use-disconnect-wallet";
import { useIsPhoneLinked } from "@/hooks/use-is-phone-linked";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { AccountNoticeLine } from "../components/account-notice-line";
import { MainWalletOnlyNotice } from "../components/main-wallet-only-notice";
import { PerpsSourceLabel } from "../components/perps-source-label";
import { WalletModal } from "../components/wallet-modal";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;

interface Stat {
	label: string;
	value: string;
	valueClass?: string;
}

function getMarginRatioClass(marginRatio: string): string {
	const ratio = toNumberOrZero(marginRatio);
	if (ratio > 0.8) return "text-error";
	if (ratio > 0.5) return "text-warning";
	return "";
}

function getStats(perps: PerpsOverview): Stat[] {
	if (perps.kind === "spot") {
		return [
			{
				label: ACCOUNT_TEXT.AVAILABLE_LABEL,
				value: formatToken(perps.available, { decimals: 2, symbol: perps.token.displayName }),
			},
		];
	}
	const { metrics } = perps;
	return [
		{ label: ACCOUNT_TEXT.BALANCE_LABEL, value: formatUSD(metrics.rawUsd) },
		{ label: ACCOUNT_TEXT.AVAILABLE_LABEL, value: formatUSD(metrics.available) },
		{ label: ACCOUNT_TEXT.MARGIN_USED_LABEL, value: formatUSD(metrics.marginUsed) },
		{
			label: ACCOUNT_TEXT.MARGIN_RATIO_LABEL,
			value: formatPercent(metrics.marginRatio),
			valueClass: getMarginRatioClass(metrics.marginRatio),
		},
		{ label: t`Maintenance Margin`, value: formatUSD(metrics.maintenanceMargin) },
		{ label: ACCOUNT_TEXT.CROSS_LEVERAGE_LABEL, value: `${formatNumber(metrics.crossLeverage, 2)}x` },
	];
}

interface MobileAccountViewProps {
	className?: string;
}

export function MobileAccountView({ className }: MobileAccountViewProps) {
	const { address, isConnected } = useConnection();
	const disconnect = useDisconnectWallet();
	const isPhoneLinked = useIsPhoneLinked();

	const account = useAccountState();
	const { data: market } = useSelectedMarketInfo();
	const summary = getAccountSummary(account, market);
	const perps = summary.status === "ready" ? summary.perps : null;
	const isLoading = account.status === "loading";

	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const { copied, copy } = useCopyToClipboard();
	const { open: openDepositModal } = useDepositModalActions();

	function handleCopyAddress() {
		if (!address) return;
		copy(address);
	}

	const unrealizedPnl = perps?.kind === "ledger" ? perps.metrics.unrealizedPnl : null;
	const isPnlUp = toNumberOrZero(unrealizedPnl) >= 0;

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
							<div className="flex items-baseline justify-between gap-2 text-2xs uppercase font-medium text-fg-muted mb-1.5">
								{ACCOUNT_TEXT.EQUITY_LABEL}
								{perps && <PerpsSourceLabel place={perps.place} token={perps.token} className="normal-case" />}
							</div>
							<div className="text-3xl font-bold tabular-nums text-fg">
								{formatUSD(perps?.kind === "spot" ? perps.total : perps?.metrics.equity)}
							</div>
							{unrealizedPnl !== null && (
								<div className={cn("text-sm tabular-nums mt-1.5 font-medium", isPnlUp ? "text-success" : "text-error")}>
									{isPnlUp ? "+" : ""}
									{formatUSD(unrealizedPnl)} {ACCOUNT_TEXT.UNREALIZED_LABEL}
								</div>
							)}
							{perps?.notice && <AccountNoticeLine notice={perps.notice} token={perps.token} className="mt-2" />}
						</Skeleton>
					</div>

					<div className="grid grid-cols-2 gap-3">
						{perps ? (
							getStats(perps).map((stat) => (
								<StatCard
									key={stat.label}
									label={stat.label}
									value={stat.value}
									valueClass={stat.valueClass}
									isLoading={isLoading}
								/>
							))
						) : (
							<StatCard label={ACCOUNT_TEXT.AVAILABLE_LABEL} value={FALLBACK_VALUE_PLACEHOLDER} isLoading={isLoading} />
						)}
					</div>

					<div className="grid grid-cols-3 gap-2 pt-2">
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("withdraw")}
							disabled={isPhoneLinked}
							iconLeft={<UploadSimpleIcon className="size-4" />}
						>
							{ACCOUNT_TEXT.WITHDRAW_LABEL}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("deposit")}
							disabled={isPhoneLinked}
							iconLeft={<DownloadSimpleIcon className="size-4" />}
						>
							{ACCOUNT_TEXT.DEPOSIT_LABEL}
						</Button>
						<Button
							variant="outline"
							intent="neutral"
							size="md"
							onClick={() => openDepositModal("bridge")}
							disabled={isPhoneLinked}
							iconLeft={<ArrowsLeftRightIcon className="size-4" />}
						>
							{t`Bridge`}
						</Button>
					</div>
					{isPhoneLinked && <MainWalletOnlyNotice className="justify-center" />}
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
