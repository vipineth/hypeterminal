import {
	ArrowSquareOutIcon,
	CopyIcon,
	LightningIcon,
	SignOutIcon,
	WalletIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useConnection, useDisconnect } from "wagmi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsContentGroup, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_QUOTE_TOKEN, FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard";
import { cn } from "@/lib/cn";
import { formatPercent, formatToken, formatUSD, shortenAddress } from "@/lib/format";
import { getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { WalletDialog } from "../components/wallet-dialog";
import { MobileBottomNavSpacer } from "./mobile-bottom-nav";

const ACCOUNT_TEXT = UI_TEXT.ACCOUNT_PANEL;

type SummaryRow = {
	label: string;
	value: string;
	valueClassName?: string;
};

interface Props {
	className?: string;
}

export function MobileAccountView({ className }: Props) {
	const { address, isConnected } = useConnection();
	const disconnect = useDisconnect();

	const { perpSummary, perpPositions, spotBalances, isLoading, hasError } = useAccountBalances();

	const [walletDialogOpen, setWalletDialogOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("perps");
	const { copied, copy } = useCopyToClipboard();
	const { open: openDepositModal } = useDepositModalActions();

	function handleCopyAddress() {
		if (!address) return;
		copy(address);
	}

	const perpMetrics = (() => {
		if (!perpSummary) return null;

		const accountValue = toNumberOrZero(perpSummary.accountValue);
		const totalNtlPos = toNumberOrZero(perpSummary.totalNtlPos);
		const totalMarginUsed = toNumberOrZero(perpSummary.totalMarginUsed);
		const totalRawUsd = toNumberOrZero(perpSummary.totalRawUsd);

		let unrealizedPnl = 0;
		for (const pos of perpPositions) {
			unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
		}

		const marginRatio = accountValue > 0 ? totalMarginUsed / accountValue : 0;
		const crossLeverage = accountValue > 0 ? Math.abs(totalNtlPos) / accountValue : 0;
		const availableBalance = Math.max(0, accountValue - totalMarginUsed);

		return {
			accountValue,
			totalRawUsd,
			unrealizedPnl,
			marginRatio,
			crossLeverage,
			availableBalance,
			totalMarginUsed,
		};
	})();

	const spotMetrics = (() => {
		if (!isConnected) return null;

		let totalValue = 0;
		let availableValue = 0;
		let inOrderValue = 0;
		const tokens: Array<{ coin: string; total: number; available: number; usdValue: number }> = [];

		for (const b of spotBalances) {
			const total = toNumberOrZero(b.total);
			const hold = toNumberOrZero(b.hold);
			const entryNtl = toNumberOrZero(b.entryNtl);

			if (total === 0) continue;

			const available = Math.max(0, total - hold);
			const usdValue = b.coin === DEFAULT_QUOTE_TOKEN ? total : entryNtl;

			totalValue += usdValue;
			availableValue += b.coin === DEFAULT_QUOTE_TOKEN ? available : (available / total) * usdValue;
			inOrderValue += b.coin === DEFAULT_QUOTE_TOKEN ? hold : (hold / total) * usdValue;

			tokens.push({ coin: b.coin, total, available, usdValue });
		}

		tokens.sort((a, b) => b.usdValue - a.usdValue);

		return {
			totalValue,
			availableValue,
			inOrderValue,
			tokenCount: tokens.length,
			topTokens: tokens.slice(0, 3),
		};
	})();

	const hasPerpData = isConnected && perpMetrics !== null;
	const hasSpotData = isConnected && spotMetrics !== null;

	function getHeaderEquity() {
		if (activeTab === "perps") {
			return hasPerpData ? formatUSD(perpMetrics.accountValue) : FALLBACK_VALUE_PLACEHOLDER;
		}
		return hasSpotData ? formatUSD(spotMetrics.totalValue) : FALLBACK_VALUE_PLACEHOLDER;
	}

	function getHeaderPnl() {
		if (activeTab === "perps" && hasPerpData) {
			return formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" });
		}
		return FALLBACK_VALUE_PLACEHOLDER;
	}

	const perpRows: SummaryRow[] = perpMetrics
		? [
				{
					label: ACCOUNT_TEXT.BALANCE_LABEL,
					value: formatUSD(perpMetrics.totalRawUsd),
					valueClassName: "tabular-nums text-market-up-600",
				},
				{
					label: ACCOUNT_TEXT.UNREALIZED_LABEL,
					value: formatUSD(perpMetrics.unrealizedPnl, { signDisplay: "exceptZero" }),
					valueClassName: cn("tabular-nums", getValueColorClass(perpMetrics.unrealizedPnl)),
				},
				{
					label: ACCOUNT_TEXT.AVAILABLE_LABEL,
					value: formatUSD(perpMetrics.availableBalance),
					valueClassName: "tabular-nums",
				},
				{
					label: ACCOUNT_TEXT.MARGIN_USED_LABEL,
					value: formatUSD(perpMetrics.totalMarginUsed),
					valueClassName: "tabular-nums",
				},
				{
					label: ACCOUNT_TEXT.MARGIN_RATIO_LABEL,
					value: formatPercent(perpMetrics.marginRatio, { maximumFractionDigits: 1 }),
					valueClassName: "tabular-nums",
				},
				{
					label: ACCOUNT_TEXT.CROSS_LEVERAGE_LABEL,
					value: `${perpMetrics.crossLeverage.toFixed(2)}x`,
					valueClassName: "tabular-nums",
				},
			]
		: [];

	const spotRows: SummaryRow[] = spotMetrics
		? [
				{
					label: ACCOUNT_TEXT.SPOT_TOTAL_VALUE_LABEL,
					value: formatUSD(spotMetrics.totalValue),
					valueClassName: "tabular-nums",
				},
				{
					label: ACCOUNT_TEXT.SPOT_AVAILABLE_LABEL,
					value: formatUSD(spotMetrics.availableValue),
					valueClassName: "tabular-nums",
				},
				{
					label: ACCOUNT_TEXT.SPOT_IN_ORDERS_LABEL,
					value: formatUSD(spotMetrics.inOrderValue),
					valueClassName: "tabular-nums text-warning-700",
				},
				{
					label: ACCOUNT_TEXT.SPOT_ASSETS_LABEL,
					value: `${spotMetrics.tokenCount}`,
					valueClassName: "tabular-nums",
				},
				...spotMetrics.topTokens.map((token) => ({
					label: token.coin,
					value: formatToken(token.total, token.coin === DEFAULT_QUOTE_TOKEN ? 2 : 4),
					valueClassName: "tabular-nums",
				})),
			]
		: [];

	if (!isConnected) {
		return (
			<div className={cn("flex flex-col h-full min-h-0 bg-surface-execution/20", className)}>
				<div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
					<div className="size-20 rounded-full bg-surface-analysis flex items-center justify-center">
						<WalletIcon className="size-10 text-text-600" />
					</div>
					<div className="text-center space-y-2">
						<h2 className="text-lg font-semibold">Connect Wallet</h2>
						<p className="text-sm text-text-600 max-w-xs">
							Connect your wallet to view your account, positions, and start trading.
						</p>
					</div>
					<Button
						variant="text"
						size="none"
						onClick={() => setWalletDialogOpen(true)}
						className={cn(
							"px-6 py-3 text-base font-semibold rounded-xs",
							"bg-primary-default/20 border border-primary-default text-primary-default",
							"hover:bg-primary-default/30 transition-colors",
							"min-h-[48px]",
						)}
					>
						Connect Wallet
					</Button>
				</div>
				<MobileBottomNavSpacer />
				<WalletDialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen} />
			</div>
		);
	}

	const headerEquity = getHeaderEquity();
	const headerPnl = getHeaderPnl();
	const headerPnlClass =
		activeTab === "perps" && hasPerpData ? getValueColorClass(perpMetrics.unrealizedPnl) : "text-text-950";

	return (
		<div className={cn("flex flex-col h-full min-h-0 bg-surface-execution/20", className)}>
			<div className="shrink-0 px-4 py-4 border-b border-border-200/60 bg-surface-execution/30">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="size-10 rounded-full bg-primary-default/20 flex items-center justify-center">
							<span className="text-primary-default font-bold">{address?.slice(2, 4).toUpperCase()}</span>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="font-mono text-sm">{shortenAddress(address ?? "")}</span>
								<Button
									variant="text"
									size="none"
									onClick={handleCopyAddress}
									className="p-1.5 text-text-600 hover:text-text-950 hover:bg-transparent transition-colors"
									aria-label="Copy address"
								>
									<CopyIcon className={cn("size-3.5", copied && "text-market-up-600")} />
								</Button>
							</div>
							<Badge variant="outline" className="text-xs mt-0.5">
								Cross Margin
							</Badge>
						</div>
					</div>
					<Button
						variant="text"
						size="none"
						onClick={() => disconnect.mutate()}
						className={cn(
							"p-2.5 text-text-600 hover:text-market-down-600",
							"transition-colors rounded-xs hover:bg-transparent",
							"min-h-[44px] min-w-[44px] flex items-center justify-center",
						)}
						aria-label="Disconnect wallet"
					>
						<SignOutIcon className="size-5" />
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="p-2 space-y-4">
					<div className="p-4 rounded-xs border border-border-200/60 bg-surface-execution/30">
						{isLoading ? (
							<div className="space-y-3">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-32" />
								<Skeleton className="h-4 w-24" />
							</div>
						) : (
							<>
								<div className="text-sm text-text-600 mb-1">{ACCOUNT_TEXT.EQUITY_LABEL}</div>
								<div className="text-3xl font-bold tabular-nums">{headerEquity}</div>
								{activeTab === "perps" && (
									<div className={cn("text-sm tabular-nums mt-1", headerPnlClass)}>
										{headerPnl} {ACCOUNT_TEXT.UNREALIZED_LABEL}
									</div>
								)}
							</>
						)}
					</div>

					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList variant="pill" fullWidth>
							<TabsTrigger value="perps">{ACCOUNT_TEXT.TAB_PERPS}</TabsTrigger>
							<TabsTrigger value="spot">{ACCOUNT_TEXT.TAB_SPOT}</TabsTrigger>
						</TabsList>

						<TabsContentGroup>
							<TabsContent value="perps" forceMount>
								{hasPerpData ? (
									<InfoRowGroup className="divide-border-200/30 mt-3">
										{perpRows.map((row) => (
											<InfoRow
												key={row.label}
												label={row.label}
												value={row.value}
												valueClassName={row.valueClassName}
											/>
										))}
									</InfoRowGroup>
								) : (
									<div className="text-2xs text-text-600 text-center py-4">{ACCOUNT_TEXT.LOADING}</div>
								)}
							</TabsContent>
							<TabsContent value="spot" forceMount>
								{hasSpotData ? (
									<InfoRowGroup className="divide-border-200/30 mt-3">
										{spotRows.map((row) => (
											<InfoRow
												key={row.label}
												label={row.label}
												value={row.value}
												valueClassName={row.valueClassName}
											/>
										))}
									</InfoRowGroup>
								) : (
									<div className="text-2xs text-text-600 text-center py-4">{ACCOUNT_TEXT.LOADING}</div>
								)}
							</TabsContent>
						</TabsContentGroup>
					</Tabs>

					<div className="grid grid-cols-2 gap-3 pt-2">
						<Button
							variant="text"
							size="none"
							onClick={() => openDepositModal("deposit")}
							className={cn(
								"py-4 text-base font-semibold rounded-xs",
								"bg-market-up-100 border border-market-up-600 text-market-up-600",
								"hover:bg-market-up-100/30 transition-colors",
								"flex items-center justify-center gap-2",
								"min-h-[56px]",
							)}
						>
							<LightningIcon className="size-5" />
							{ACCOUNT_TEXT.DEPOSIT_LABEL}
						</Button>
						<Button
							variant="text"
							size="none"
							onClick={() => openDepositModal("withdraw")}
							className={cn(
								"py-4 text-base font-semibold rounded-xs",
								"bg-surface-analysis border border-border-200/60 text-text-950",
								"hover:bg-surface-analysis transition-colors",
								"flex items-center justify-center gap-2",
								"min-h-[56px]",
							)}
						>
							<ArrowSquareOutIcon className="size-5" />
							{ACCOUNT_TEXT.WITHDRAW_LABEL}
						</Button>
					</div>

					{hasError && (
						<div className="flex items-center gap-2 px-3 py-2 rounded-xs bg-error-100 border border-error-700/20">
							<WarningCircleIcon className="size-4 text-error-700 shrink-0" />
							<span className="text-2xs text-error-700">{ACCOUNT_TEXT.ERROR_LOADING}</span>
						</div>
					)}
				</div>
			</div>

			<MobileBottomNavSpacer />
		</div>
	);
}
