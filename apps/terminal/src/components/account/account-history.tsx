import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { UserNonFundingLedgerUpdatesResponse } from "@nktkas/hyperliquid";
import {
	ArrowSquareOutIcon,
	ArrowsDownUpIcon,
	ClockCounterClockwiseIcon,
	DownloadSimpleIcon,
	GavelIcon,
	GiftIcon,
	PaperPlaneTiltIcon,
	UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { AssetDisplay } from "@/components/trade/components/asset-display";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsContentGroup, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { getExplorerTxUrl } from "@/lib/explorer";
import { formatDateTimeShort, formatNumber, formatPercent, formatToken, formatUSD } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useInfoHistoricalOrders } from "@/lib/hyperliquid/hooks/info/useInfoHistoricalOrders";
import { useInfoUserFillsByTime } from "@/lib/hyperliquid/hooks/info/useInfoUserFillsByTime";
import { useInfoUserFunding } from "@/lib/hyperliquid/hooks/info/useInfoUserFunding";
import { useInfoUserNonFundingLedgerUpdates } from "@/lib/hyperliquid/hooks/info/useInfoUserNonFundingLedgerUpdates";
import { getValueColorClass, toNumber, toNumberOrZero } from "@/lib/trade/numbers";
import { getSideClass, getSideLabel } from "@/lib/trade/open-orders";

type TimeRange = "1d" | "7d" | "30d" | "all";

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
	{ value: "1d", label: "1D" },
	{ value: "7d", label: "7D" },
	{ value: "30d", label: "30D" },
	{ value: "all", label: "All" },
];

function getStartTime(range: TimeRange): number | undefined {
	if (range === "all") return undefined;
	const ms = { "1d": 86400000, "7d": 604800000, "30d": 2592000000 }[range];
	return Date.now() - ms;
}

interface Props {
	address: string;
}

export function AccountHistory({ address }: Props) {
	const [tab, setTab] = useState("trades");

	return (
		<div className="rounded-xs border border-stroke-weak bg-bg-raised">
			<Tabs value={tab} onValueChange={setTab}>
				<TabsList variant="underline">
					<TabsTrigger value="trades">
						<Trans>Trades</Trans>
					</TabsTrigger>
					<TabsTrigger value="funding">
						<Trans>Funding</Trans>
					</TabsTrigger>
					<TabsTrigger value="orders">
						<Trans>Orders</Trans>
					</TabsTrigger>
					<TabsTrigger value="ledger">
						<Trans>Ledger</Trans>
					</TabsTrigger>
				</TabsList>

				<TabsContentGroup>
					<TabsContent value="trades">
						<TradesTab address={address} />
					</TabsContent>
					<TabsContent value="funding">
						<FundingTab address={address} />
					</TabsContent>
					<TabsContent value="orders">
						<OrdersTab address={address} />
					</TabsContent>
					<TabsContent value="ledger">
						<LedgerTab address={address} />
					</TabsContent>
				</TabsContentGroup>
			</Tabs>
		</div>
	);
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
	return (
		<div className="flex items-center gap-1">
			{TIME_RANGES.map((r) => (
				<button
					key={r.value}
					type="button"
					onClick={() => onChange(r.value)}
					className={cn(
						"px-2 py-0.5 rounded-xs text-3xs font-medium transition-colors",
						value === r.value
							? "bg-fill-brand-strong text-text-inverse-strong"
							: "text-text-weak hover:text-text-strong hover:bg-bg-alternate",
					)}
				>
					{r.label}
				</button>
			))}
		</div>
	);
}

function LoadingSkeleton() {
	return (
		<div className="p-4 space-y-3">
			<Skeleton className="h-5 w-full" />
			<Skeleton className="h-5 w-full" />
			<Skeleton className="h-5 w-full" />
			<Skeleton className="h-5 w-3/4" />
		</div>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-sm text-text-weak">
			<ClockCounterClockwiseIcon className="size-8 mb-2 text-text-weak" />
			{message}
		</div>
	);
}

const HEAD_CLASS = "text-3xs font-medium uppercase text-text-weak h-7";
const CELL_CLASS = "text-xs py-1.5";

function ExplorerLink({ hash, time }: { hash: string; time: number }) {
	const url = getExplorerTxUrl(hash);
	if (!url) return <span className="tabular-nums text-text-weak">{formatDateTimeShort(time)}</span>;

	return (
		<a
			className="flex items-center gap-1 tabular-nums text-text-weak underline decoration-dashed decoration-text-500/30"
			href={url}
			target="_blank"
			rel="noopener noreferrer"
		>
			<span>{formatDateTimeShort(time)}</span>
			<ArrowSquareOutIcon className="size-2.5" />
		</a>
	);
}

function TradesTab({ address }: { address: string }) {
	const [range, setRange] = useState<TimeRange>("7d");
	const startTime = getStartTime(range);
	const markets = useMarkets();

	const { data, isLoading } = useInfoUserFillsByTime({
		user: address,
		startTime,
		aggregateByTime: true,
	});

	const fills = data?.slice().sort((a, b) => b.time - a.time) ?? [];

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-3 py-2 border-b border-stroke-weak/40">
				<span className="text-3xs text-text-weak tabular-nums">
					{fills.length} {t`trades`}
				</span>
				<TimeRangeSelector value={range} onChange={setRange} />
			</div>
			{isLoading ? (
				<LoadingSkeleton />
			) : fills.length === 0 ? (
				<EmptyState message={t`No trades found.`} />
			) : (
				<ScrollArea className="max-h-96">
					<Table>
						<TableHeader>
							<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
								<TableHead className={HEAD_CLASS}>{t`Asset`}</TableHead>
								<TableHead className={HEAD_CLASS}>{t`Side`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Price`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Size`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Fee`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`PNL`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Time`}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{fills.map((fill, i) => {
								const fee = toNumber(fill.fee);
								const closedPnl = toNumber(fill.closedPnl);
								const showPnl = closedPnl !== null && closedPnl !== 0;

								return (
									<TableRow
										key={`${fill.hash}-${fill.tid}`}
										className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", i % 2 === 1 && "bg-bg-alternate")}
									>
										<TableCell className={cn(CELL_CLASS, "font-medium")}>
											<AssetDisplay coin={fill.coin} />
										</TableCell>
										<TableCell className={CELL_CLASS}>
											<span
												className={cn(
													"text-3xs px-1 py-0.5 rounded-sm uppercase",
													fill.liquidation ? "bg-fill-error-weak text-market-down" : "bg-bg-alternate/50",
												)}
											>
												{fill.liquidation ? t`Liquidated` : fill.dir}
											</span>
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>{formatUSD(fill.px)}</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{formatNumber(fill.sz, markets.getSzDecimals(fill.coin))}
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											<span className={getValueColorClass(fee)}>
												{formatToken(fill.fee, { symbol: fill.feeToken })}
											</span>
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{showPnl ? (
												<span className={getValueColorClass(closedPnl)}>
													{formatUSD(closedPnl, { signDisplay: "exceptZero" })}
												</span>
											) : (
												<span className="text-text-weak">—</span>
											)}
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right")}>
											<ExplorerLink hash={fill.hash} time={fill.time} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			)}
		</div>
	);
}

function FundingTab({ address }: { address: string }) {
	const [range, setRange] = useState<TimeRange>("7d");
	const startTime = getStartTime(range);
	const markets = useMarkets();

	const { data, isLoading } = useInfoUserFunding({
		user: address,
		startTime,
	});

	const entries = data?.slice().sort((a, b) => b.time - a.time) ?? [];
	const totalFunding = entries.reduce((acc, f) => acc + toNumberOrZero(f.delta.usdc), 0);

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-3 py-2 border-b border-stroke-weak/40">
				<span className="text-3xs text-text-weak tabular-nums">
					{entries.length} {t`payments`}
					{entries.length > 0 && (
						<span className={cn("ml-2 font-semibold", getValueColorClass(totalFunding))}>
							{formatUSD(totalFunding, { signDisplay: "exceptZero" })}
						</span>
					)}
				</span>
				<TimeRangeSelector value={range} onChange={setRange} />
			</div>
			{isLoading ? (
				<LoadingSkeleton />
			) : entries.length === 0 ? (
				<EmptyState message={t`No funding payments found.`} />
			) : (
				<ScrollArea className="max-h-96">
					<Table>
						<TableHeader>
							<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
								<TableHead className={HEAD_CLASS}>{t`Asset`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Position`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Rate`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Payment`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Time`}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((entry, i) => {
								const { delta } = entry;
								const market = markets.getMarket(delta.coin);
								const szi = toNumber(delta.szi);
								const rate = toNumber(delta.fundingRate);
								const usdc = toNumber(delta.usdc);
								const positionSize = szi !== null ? Math.abs(szi) : null;

								return (
									<TableRow
										key={`${delta.coin}-${entry.time}-${i}`}
										className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", i % 2 === 1 && "bg-bg-alternate")}
									>
										<TableCell className={cn(CELL_CLASS, "font-medium")}>
											<AssetDisplay coin={delta.coin} />
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{formatToken(positionSize, {
												decimals: market?.szDecimals,
												symbol: market?.shortName,
											})}
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											<span className={rate !== null ? getValueColorClass(rate) : undefined}>
												{formatPercent(rate, {
													minimumFractionDigits: 4,
													maximumFractionDigits: 4,
												})}
											</span>
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											<span className={getValueColorClass(usdc)}>{formatUSD(usdc, { signDisplay: "exceptZero" })}</span>
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right")}>
											<ExplorerLink hash={entry.hash} time={entry.time} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			)}
		</div>
	);
}

function OrdersTab({ address }: { address: string }) {
	const markets = useMarkets();

	const { data, isLoading } = useInfoHistoricalOrders({ user: address });

	const orders =
		data
			?.slice()
			.sort((a, b) => b.statusTimestamp - a.statusTimestamp)
			.slice(0, 200) ?? [];

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-3 py-2 border-b border-stroke-weak/40">
				<span className="text-3xs text-text-weak tabular-nums">
					{orders.length} {t`orders`}
				</span>
			</div>
			{isLoading ? (
				<LoadingSkeleton />
			) : orders.length === 0 ? (
				<EmptyState message={t`No order history found.`} />
			) : (
				<ScrollArea className="max-h-96">
					<Table>
						<TableHeader>
							<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
								<TableHead className={HEAD_CLASS}>{t`Asset`}</TableHead>
								<TableHead className={HEAD_CLASS}>{t`Type`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Price`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Size`}</TableHead>
								<TableHead className={HEAD_CLASS}>{t`Status`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Time`}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((entry, i) => {
								const { order } = entry;
								const market = markets.getMarket(order.coin);

								return (
									<TableRow
										key={`${order.oid}-${entry.statusTimestamp}`}
										className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", i % 2 === 1 && "bg-bg-alternate")}
									>
										<TableCell className={cn(CELL_CLASS, "font-medium")}>
											<div className="flex items-center gap-1.5">
												<AssetDisplay coin={order.coin} />
												<span className={cn("text-3xs px-1 py-0.5 rounded-sm uppercase", getSideClass(order.side))}>
													{getSideLabel(order.side, market?.kind)}
												</span>
											</div>
										</TableCell>
										<TableCell className={CELL_CLASS}>{order.orderType}</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{formatUSD(order.limitPx, { compact: false })}
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{formatToken(order.origSz, market?.szDecimals)}
										</TableCell>
										<TableCell className={CELL_CLASS}>
											<OrderStatusBadge status={entry.status} />
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums text-text-weak whitespace-nowrap")}>
											{formatDateTimeShort(entry.statusTimestamp)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			)}
		</div>
	);
}

function OrderStatusBadge({ status }: { status: string }) {
	const colorClass =
		status === "filled"
			? "text-market-up bg-fill-success-weak"
			: status === "open" || status === "triggered"
				? "text-text-brand bg-fill-brand-weak"
				: "text-text-weak bg-bg-alternate/50";

	return <span className={cn("text-3xs px-1.5 py-0.5 rounded-sm capitalize", colorClass)}>{status}</span>;
}

const LEDGER_TYPE_CONFIG: Record<string, { label: string; icon: typeof DownloadSimpleIcon; colorClass: string }> = {
	deposit: { label: "Deposit", icon: DownloadSimpleIcon, colorClass: "text-market-up" },
	withdraw: { label: "Withdraw", icon: UploadSimpleIcon, colorClass: "text-market-down" },
	accountClassTransfer: { label: "Transfer", icon: ArrowsDownUpIcon, colorClass: "text-text-brand" },
	internalTransfer: { label: "Transfer", icon: PaperPlaneTiltIcon, colorClass: "text-text-brand" },
	liquidation: { label: "Liquidation", icon: GavelIcon, colorClass: "text-market-down" },
	rewardsClaim: { label: "Reward", icon: GiftIcon, colorClass: "text-market-up" },
	spotTransfer: { label: "Spot Transfer", icon: PaperPlaneTiltIcon, colorClass: "text-text-brand" },
	subAccountTransfer: { label: "Sub Transfer", icon: ArrowsDownUpIcon, colorClass: "text-text-brand" },
	send: { label: "Send", icon: PaperPlaneTiltIcon, colorClass: "text-market-down" },
};

type LedgerDelta = UserNonFundingLedgerUpdatesResponse[number]["delta"];

function getLedgerAmount(delta: LedgerDelta): string | null {
	switch (delta.type) {
		case "deposit":
		case "withdraw":
		case "accountClassTransfer":
		case "internalTransfer":
		case "subAccountTransfer":
		case "vaultCreate":
		case "vaultDeposit":
		case "vaultDistribution":
			return delta.usdc;
		case "rewardsClaim":
		case "spotTransfer":
		case "send":
		case "deployGasAuction":
		case "cStakingTransfer":
		case "borrowLend":
		case "spotGenesis":
		case "activateDexAbstraction":
			return delta.amount;
		case "liquidation":
			return delta.liquidatedNtlPos;
		case "vaultWithdraw":
			return delta.netWithdrawnUsd;
	}
}

function getLedgerToken(delta: LedgerDelta): string {
	if ("token" in delta && typeof delta.token === "string") return delta.token;
	return "USDC";
}

function LedgerTab({ address }: { address: string }) {
	const [range, setRange] = useState<TimeRange>("30d");
	const startTime = getStartTime(range);

	const { data, isLoading } = useInfoUserNonFundingLedgerUpdates({
		user: address,
		startTime,
	});

	const entries = data?.slice().sort((a, b) => b.time - a.time) ?? [];

	return (
		<div className="flex flex-col">
			<div className="flex items-center justify-between px-3 py-2 border-b border-stroke-weak/40">
				<span className="text-3xs text-text-weak tabular-nums">
					{entries.length} {t`entries`}
				</span>
				<TimeRangeSelector value={range} onChange={setRange} />
			</div>
			{isLoading ? (
				<LoadingSkeleton />
			) : entries.length === 0 ? (
				<EmptyState message={t`No ledger activity found.`} />
			) : (
				<ScrollArea className="max-h-96">
					<Table>
						<TableHeader>
							<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
								<TableHead className={HEAD_CLASS}>{t`Type`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Amount`}</TableHead>
								<TableHead className={HEAD_CLASS}>{t`Details`}</TableHead>
								<TableHead className={cn(HEAD_CLASS, "text-right")}>{t`Time`}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{entries.map((entry, i) => {
								const config = LEDGER_TYPE_CONFIG[entry.delta.type];
								const Icon = config?.icon ?? ClockCounterClockwiseIcon;
								const label = config?.label ?? entry.delta.type;
								const colorClass = config?.colorClass ?? "text-text-weak";
								const amount = getLedgerAmount(entry.delta);
								const token = getLedgerToken(entry.delta);

								return (
									<TableRow
										key={`${entry.hash}-${entry.time}`}
										className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", i % 2 === 1 && "bg-bg-alternate")}
									>
										<TableCell className={CELL_CLASS}>
											<div className="flex items-center gap-1.5">
												<Icon className={cn("size-3.5", colorClass)} />
												<span className="text-xs font-medium">{label}</span>
											</div>
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right tabular-nums")}>
											{amount !== null ? (
												<span className={colorClass}>
													{token === "USDC"
														? formatUSD(amount, { signDisplay: "exceptZero" })
														: formatToken(amount, { symbol: token })}
												</span>
											) : (
												<span className="text-text-weak">—</span>
											)}
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-text-weak text-3xs max-w-40 truncate")}>
											<LedgerDetails delta={entry.delta} />
										</TableCell>
										<TableCell className={cn(CELL_CLASS, "text-right")}>
											<ExplorerLink hash={entry.hash} time={entry.time} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			)}
		</div>
	);
}

function LedgerDetails({ delta }: { delta: LedgerDelta }) {
	switch (delta.type) {
		case "accountClassTransfer":
			return <span>{delta.toPerp ? t`Spot → Perp` : t`Perp → Spot`}</span>;
		case "internalTransfer":
		case "send":
		case "spotTransfer":
		case "subAccountTransfer": {
			const dest = delta.destination;
			return (
				<span>
					→ {dest.slice(0, 6)}...{dest.slice(-4)}
				</span>
			);
		}
		case "liquidation": {
			const coins = delta.liquidatedPositions.map((p) => p.coin).join(", ");
			return (
				<span>
					{delta.leverageType} · {coins}
				</span>
			);
		}
		case "rewardsClaim":
			return <span>{delta.token}</span>;
		case "withdraw":
			return (
				<span>
					{t`Fee`}: {formatUSD(delta.fee)}
				</span>
			);
		default:
			return null;
	}
}
