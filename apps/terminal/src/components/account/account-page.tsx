import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	ArrowsDownUpIcon,
	ArrowsLeftRightIcon,
	DownloadSimpleIcon,
	PaperPlaneTiltIcon,
	UploadSimpleIcon,
	WalletIcon,
} from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { Suspense, useState } from "react";
import { useConnection } from "wagmi";
import { WalletModal } from "@/components/trade/components/wallet-modal";
import { TopNav } from "@/components/trade/header/top-nav";
import { TestnetBanner } from "@/components/trade/testnet-banner";
import { InfoRow, InfoRowGroup } from "@/components/ui/info-row";
import { DEFAULT_QUOTE_TOKEN } from "@/config/constants";
import { useAccountBalances } from "@/hooks/trade/use-account-balances";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useUserPositions } from "@/lib/hyperliquid";
import { createLazyComponent } from "@/lib/lazy";
import { getValueColorClass, toNumberOrZero } from "@/lib/trade/numbers";
import { useDepositModalActions } from "@/stores/use-global-modal-store";
import { useIsTestnet } from "@/stores/use-global-settings-store";

const TransferModal = createLazyComponent(() => import("@/components/trade/positions/transfer-modal"), "TransferModal");
const SendModal = createLazyComponent(() => import("@/components/trade/positions/send-modal"), "SendModal");
const GlobalModals = createLazyComponent(() => import("@/components/trade/components/global-modals"), "GlobalModals");

export function AccountPage() {
	const isMobile = useIsMobile();
	const isTestnet = useIsTestnet();

	return (
		<>
			<div
				className={cn(
					"bg-bg-base text-text-strong min-h-screen w-full flex flex-col",
					isTestnet ? "pt-[4.75rem]" : "pt-11",
					isTestnet && "testnet-bg",
				)}
			>
				<TestnetBanner />
				<TopNav />
				<main className={cn("flex-1 w-full mx-auto px-4 py-6", isMobile ? "max-w-lg" : "max-w-4xl")}>
					<AccountContent />
				</main>
			</div>
			<Suspense fallback={null}>
				<GlobalModals />
			</Suspense>
		</>
	);
}

function AccountContent() {
	const { address, isConnected } = useConnection();
	const [walletModalOpen, setWalletModalOpen] = useState(false);

	if (!isConnected) {
		return (
			<>
				<div className="flex flex-col items-center justify-center gap-6 py-20">
					<div className="size-20 rounded-full bg-fill-weak flex items-center justify-center">
						<WalletIcon className="size-10 text-text-weak" />
					</div>
					<div className="text-center space-y-2">
						<h1 className="text-lg font-semibold">
							<Trans>Connect Wallet</Trans>
						</h1>
						<p className="text-sm text-text-weak max-w-xs">
							<Trans>Connect your wallet to view your account overview, positions, and history.</Trans>
						</p>
					</div>
					<Button variant="filled" intent="brand" size="md" onClick={() => setWalletModalOpen(true)}>
						<Trans>Connect Wallet</Trans>
					</Button>
				</div>
				<WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
			</>
		);
	}

	return <ConnectedAccountView address={address as string} />;
}

function ConnectedAccountView({ address }: { address: string }) {
	const { perpSummary, perpPositions, spotBalances, isLoading } = useAccountBalances();
	const { withdrawable } = useUserPositions();
	const { open: openDepositModal } = useDepositModalActions();
	const isMobile = useIsMobile();

	const [transferOpen, setTransferOpen] = useState(false);
	const [sendOpen, setSendOpen] = useState(false);
	const [equityTab, setEquityTab] = useState("perps");

	const accountValue = toNumberOrZero(perpSummary?.accountValue);
	const totalMarginUsed = toNumberOrZero(perpSummary?.totalMarginUsed);
	const totalNtlPos = toNumberOrZero(perpSummary?.totalNtlPos);
	const totalRawUsd = toNumberOrZero(perpSummary?.totalRawUsd);
	const withdrawableNum = toNumberOrZero(withdrawable);

	const availableBalance = Math.max(0, accountValue - totalMarginUsed);
	const marginRatio = accountValue > 0 ? totalMarginUsed / accountValue : 0;
	const crossLeverage = accountValue > 0 ? Math.abs(totalNtlPos) / accountValue : 0;

	let unrealizedPnl = 0;
	for (const pos of perpPositions) {
		unrealizedPnl += toNumberOrZero(pos.position.unrealizedPnl);
	}

	let spotTotalValue = 0;
	for (const b of spotBalances) {
		const total = toNumberOrZero(b.total);
		if (total === 0) continue;
		spotTotalValue += b.coin === DEFAULT_QUOTE_TOKEN ? total : toNumberOrZero(b.entryNtl);
	}

	const totalEquity = accountValue + spotTotalValue;

	const marginRatioPercent = marginRatio * 100;
	const marginBarColor =
		marginRatioPercent > 80 ? "bg-market-down" : marginRatioPercent > 50 ? "bg-fill-warning-strong" : "bg-market-up";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-lg font-semibold">
					<Trans>Account</Trans>
				</h1>
				<p className="text-xs text-text-weak font-mono mt-0.5">
					{address.slice(0, 6)}...{address.slice(-4)}
				</p>
			</div>

			<div className="rounded-xs border border-stroke-weak bg-bg-raised p-4">
				{isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-8 w-40" />
						<Skeleton className="h-4 w-28" />
					</div>
				) : (
					<div className="flex items-baseline justify-between">
						<div>
							<div className="text-2xs text-text-weak mb-1">
								<Trans>Total Equity</Trans>
							</div>
							<div className="text-2xl font-bold tabular-nums">{formatUSD(totalEquity)}</div>
							<div className="flex items-center gap-2 mt-1">
								<span className="text-2xs text-text-weak">
									<Trans>Perps</Trans>
								</span>
								<span className="text-xs tabular-nums">{formatUSD(accountValue)}</span>
								<span className="text-2xs text-text-weak ml-2">
									<Trans>Spot</Trans>
								</span>
								<span className="text-xs tabular-nums">{formatUSD(spotTotalValue)}</span>
							</div>
						</div>
						<div className="text-right">
							<div className="text-2xs text-text-weak mb-1">
								<Trans>Unrealized PNL</Trans>
							</div>
							<div className={cn("text-base font-semibold tabular-nums", getValueColorClass(unrealizedPnl))}>
								{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="rounded-xs border border-stroke-weak bg-bg-raised">
				<Tabs value={equityTab} onValueChange={setEquityTab}>
					<TabsList variant="underline">
						<TabsTrigger value="perps">
							<Trans>Perps</Trans>
						</TabsTrigger>
						<TabsTrigger value="spot">
							<Trans>Spot</Trans>
						</TabsTrigger>
					</TabsList>

					<div className="p-3">
						<TabsContent value="perps">
							<PerpMetrics
								isLoading={isLoading}
								balance={totalRawUsd}
								unrealizedPnl={unrealizedPnl}
								availableBalance={availableBalance}
								totalMarginUsed={totalMarginUsed}
								marginRatio={marginRatio}
								marginBarColor={marginBarColor}
								crossLeverage={crossLeverage}
								withdrawable={withdrawableNum}
							/>
						</TabsContent>
						<TabsContent value="spot">
							<SpotMetrics isLoading={isLoading} spotBalances={spotBalances} />
						</TabsContent>
					</div>
				</Tabs>
			</div>

			<div className={cn("grid gap-2", isMobile ? "grid-cols-2" : "grid-cols-5")}>
				<Button variant="outline" intent="neutral" onClick={() => openDepositModal("deposit")}>
					<DownloadSimpleIcon className="size-4" />
					<Trans>Deposit</Trans>
				</Button>
				<Button variant="outline" intent="neutral" onClick={() => openDepositModal("withdraw")}>
					<UploadSimpleIcon className="size-4" />
					<Trans>Withdraw</Trans>
				</Button>
				<Button variant="outline" intent="neutral" onClick={() => openDepositModal("bridge")}>
					<ArrowsLeftRightIcon className="size-4" />
					<Trans>Bridge</Trans>
				</Button>
				<Button variant="outline" intent="neutral" onClick={() => setTransferOpen(true)}>
					<ArrowsDownUpIcon className="size-4" />
					<Trans>Transfer</Trans>
				</Button>
				<Button variant="outline" intent="neutral" onClick={() => setSendOpen(true)}>
					<PaperPlaneTiltIcon className="size-4" />
					<Trans>Send</Trans>
				</Button>
			</div>

			<Suspense fallback={null}>
				<TransferModal open={transferOpen} onOpenChange={setTransferOpen} />
				<SendModal open={sendOpen} onOpenChange={setSendOpen} />
			</Suspense>
		</div>
	);
}

interface PerpMetricsProps {
	isLoading: boolean;
	balance: number;
	unrealizedPnl: number;
	availableBalance: number;
	totalMarginUsed: number;
	marginRatio: number;
	marginBarColor: string;
	crossLeverage: number;
	withdrawable: number;
}

function PerpMetrics({
	isLoading,
	balance,
	unrealizedPnl,
	availableBalance,
	totalMarginUsed,
	marginRatio,
	marginBarColor,
	crossLeverage,
	withdrawable,
}: PerpMetricsProps) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
			</div>
		);
	}

	return (
		<InfoRowGroup className="divide-stroke-weak/30">
			<InfoRow label={t`Balance`} value={formatUSD(balance)} valueClassName="tabular-nums" />
			<InfoRow
				label={t`Unrealized PNL`}
				value={formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
				valueClassName={cn("tabular-nums", getValueColorClass(unrealizedPnl))}
			/>
			<InfoRow label={t`Withdrawable`} value={formatUSD(withdrawable)} valueClassName="tabular-nums" />
			<InfoRow label={t`Available`} value={formatUSD(availableBalance)} valueClassName="tabular-nums" />
			<InfoRow label={t`Margin Used`} value={formatUSD(totalMarginUsed)} valueClassName="tabular-nums" />
			<div>
				<InfoRow
					label={t`Margin Ratio`}
					value={formatPercent(marginRatio, { maximumFractionDigits: 1 })}
					valueClassName="tabular-nums"
				/>
				<div className="mt-1.5 h-1.5 w-full rounded-full bg-fill-weak overflow-hidden">
					<div
						className={cn("h-full rounded-full transition-all duration-300", marginBarColor)}
						style={{ width: `${Math.min(marginRatio * 100, 100)}%` }}
					/>
				</div>
			</div>
			<InfoRow label={t`Cross Leverage`} value={`${crossLeverage.toFixed(2)}x`} valueClassName="tabular-nums" />
		</InfoRowGroup>
	);
}

interface SpotMetricsProps {
	isLoading: boolean;
	spotBalances: ReturnType<typeof useAccountBalances>["spotBalances"];
}

function SpotMetrics({ isLoading, spotBalances }: SpotMetricsProps) {
	if (isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
				<Skeleton className="h-5 w-full" />
			</div>
		);
	}

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

	return (
		<InfoRowGroup className="divide-stroke-weak/30">
			<InfoRow label={t`Total Value`} value={formatUSD(totalValue)} valueClassName="tabular-nums" />
			<InfoRow label={t`Available`} value={formatUSD(availableValue)} valueClassName="tabular-nums" />
			<InfoRow label={t`In Orders`} value={formatUSD(inOrderValue)} valueClassName="tabular-nums text-text-warning" />
			<InfoRow label={t`Assets`} value={`${tokens.length}`} valueClassName="tabular-nums" />
			{tokens.slice(0, 5).map((token) => (
				<InfoRow
					key={token.coin}
					label={token.coin}
					value={formatToken(token.total, token.coin === DEFAULT_QUOTE_TOKEN ? 2 : 4)}
					valueClassName="tabular-nums"
				/>
			))}
		</InfoRowGroup>
	);
}
