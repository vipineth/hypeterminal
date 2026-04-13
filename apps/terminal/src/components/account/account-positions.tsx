import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { ListChecksIcon, WarningIcon } from "@phosphor-icons/react";
import { Skeleton } from "boneyard-js/react";
import { useConnection } from "wagmi";
import { HL_ALL_DEXS } from "@/config/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { formatPercent, formatPrice, formatToken, formatUSD } from "@/lib/format";
import { type Position, useMarkets, useUserPositions } from "@/lib/hyperliquid";
import { useSubAllMids } from "@/lib/hyperliquid/hooks/subscription";
import type { Markets } from "@/lib/hyperliquid/markets";
import { getValueColorClass, toBig } from "@/lib/trade/numbers";
import { AssetDisplay } from "../trade/components/asset-display";

export function AccountPositions() {
	const { isConnected } = useConnection();
	const { positions, isLoading, hasError } = useUserPositions();
	const markets = useMarkets();
	const isMobile = useIsMobile();

	const allMidsEnabled = isConnected && positions.length > 0;
	const { data: allMidsEvent } = useSubAllMids({ dex: HL_ALL_DEXS }, { enabled: allMidsEnabled });
	const mids = allMidsEvent?.mids;

	if (!isConnected) return null;

	if (isLoading) {
		return (
			<Section>
				<SectionHeader count={null} />
				<div className="space-y-2 p-4">
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-5 w-3/4" />
				</div>
			</Section>
		);
	}

	if (hasError) {
		return (
			<Section>
				<SectionHeader count={null} />
				<div className="p-6 text-center text-xs text-market-down">
					<Trans>Failed to load positions.</Trans>
				</div>
			</Section>
		);
	}

	if (positions.length === 0) {
		return (
			<Section>
				<SectionHeader count={0} />
				<div className="p-6 text-center text-xs text-text-weak">
					<Trans>No open positions.</Trans>
				</div>
			</Section>
		);
	}

	return (
		<Section>
			<SectionHeader count={positions.length} />
			{isMobile ? (
				<div className="space-y-2 p-3">
					{positions.map((p) => (
						<PositionCard key={`${p.coin}-${p.szi}`} position={p} markets={markets} markPx={mids?.[p.coin]} />
					))}
				</div>
			) : (
				<PositionsTable positions={positions} markets={markets} mids={mids} />
			)}
		</Section>
	);
}

function Section({ children }: { children: React.ReactNode }) {
	return <div className="rounded-xs border border-stroke-weak bg-bg-raised overflow-hidden">{children}</div>;
}

function SectionHeader({ count }: { count: number | null }) {
	return (
		<div className="flex items-center gap-2 px-4 py-2.5 border-b border-stroke-weak/40">
			<ListChecksIcon className="size-3.5 text-text-weak" />
			<span className="text-xs font-medium">
				<Trans>Open Positions</Trans>
			</span>
			{count !== null && <span className="text-xs font-semibold text-market-up ml-auto tabular-nums">{count}</span>}
		</div>
	);
}

interface PositionsTableProps {
	positions: Position[];
	markets: Markets;
	mids: Record<string, string> | undefined;
}

function PositionsTable({ positions, markets, mids }: PositionsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow className="border-stroke-weak/40 bg-bg-alternate hover:bg-bg-alternate">
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak h-7">{t`Asset`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Size`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Entry`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Mark`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`PNL`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Leverage`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Margin`}</TableHead>
					<TableHead className="text-3xs font-medium uppercase tracking-wider text-text-weak text-right h-7">{t`Liq Price`}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{positions.map((p, i) => (
					<PositionTableRow
						key={`${p.coin}-${p.szi}`}
						position={p}
						markets={markets}
						markPx={mids?.[p.coin]}
						isEven={i % 2 === 1}
					/>
				))}
			</TableBody>
		</Table>
	);
}

interface PositionRowProps {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
	isEven: boolean;
}

function PositionTableRow({ position: p, markets, markPx: markPxRaw, isEven }: PositionRowProps) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const szDecimals = market?.szDecimals ?? 4;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null && Number.isFinite(markPx) && Number.isFinite(liqPx) && Math.abs(liqPx - markPx) / markPx <= 0.1;
	const pnlClass = getValueColorClass(unrealizedPnl);
	const leverageDisplay = `${p.leverage.value}×`;
	const marginMode = p.leverage.type === "isolated" ? t`Isolated` : t`Cross`;

	return (
		<TableRow className={cn("border-stroke-weak/40 hover:bg-bg-alternate/30", isEven && "bg-bg-alternate")}>
			<TableCell
				className={cn("text-xs font-medium py-1.5 border-l-2", isLong ? "border-l-market-up" : "border-l-market-down")}
			>
				<AssetDisplay
					coin={p.coin}
					nameClassName="text-xs"
					subtitle={
						<span className={cn("text-2xs uppercase", isLong ? "text-market-up" : "text-market-down")}>
							{isLong ? t`Long` : t`Short`}
						</span>
					}
				/>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">
				<div className="flex flex-col items-end">
					<span>{formatToken(absSize, { decimals: szDecimals, symbol: p.coin })}</span>
					<span className="text-text-weak text-2xs">({formatUSD(p.positionValue, { compact: true })})</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums text-text-weak py-1.5">
				{formatPrice(entryPx, { szDecimals })}
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">{formatPrice(markPx, { szDecimals })}</TableCell>
			<TableCell className="text-right py-1.5">
				<div className={cn("text-xs tabular-nums flex flex-col items-end", pnlClass)}>
					<span>{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}</span>
					<span className="text-text-weak text-2xs">({formatPercent(p.returnOnEquity, 1)})</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">
				<div className="flex flex-col items-end">
					<span>{leverageDisplay}</span>
					<span className="text-text-weak text-2xs">{marginMode}</span>
				</div>
			</TableCell>
			<TableCell className="text-xs text-right tabular-nums py-1.5">{formatUSD(p.marginUsed)}</TableCell>
			<TableCell
				className={cn("text-xs text-right tabular-nums py-1.5", liqIsNear ? "text-market-down" : "text-text-weak")}
			>
				<span className="inline-flex items-center gap-1">
					{liqIsNear && <WarningIcon className="size-3 text-market-down" />}
					{formatPrice(p.liquidationPx, { szDecimals })}
				</span>
			</TableCell>
		</TableRow>
	);
}

interface PositionCardProps {
	position: Position;
	markets: Markets;
	markPx: string | undefined;
}

function PositionCard({ position: p, markets, markPx: markPxRaw }: PositionCardProps) {
	const size = toBig(p.szi)?.toNumber() ?? Number.NaN;
	const isLong = size > 0;
	const absSize = Math.abs(size);
	const market = markets.getMarket(p.coin);
	const szDecimals = market?.szDecimals ?? 4;
	const markPx = toBig(markPxRaw)?.toNumber() ?? Number.NaN;
	const entryPx = toBig(p.entryPx)?.toNumber() ?? Number.NaN;
	const unrealizedPnl = toBig(p.unrealizedPnl)?.toNumber() ?? Number.NaN;
	const liqPx = toBig(p.liquidationPx)?.toNumber();
	const liqIsNear =
		liqPx != null && Number.isFinite(markPx) && Number.isFinite(liqPx) && Math.abs(liqPx - markPx) / markPx <= 0.1;
	const pnlClass = getValueColorClass(unrealizedPnl);
	const leverageDisplay = `${p.leverage.value}×`;
	const marginMode = p.leverage.type === "isolated" ? t`Isolated` : t`Cross`;

	return (
		<div className={cn("rounded-sm border bg-bg-base/50", isLong ? "border-market-up/30" : "border-market-down/30")}>
			<div className="flex items-center justify-between px-3 py-2.5 border-b border-stroke-weak/40">
				<AssetDisplay
					coin={p.coin}
					nameClassName="text-sm font-semibold"
					subtitle={
						<span className={cn("text-3xs font-medium uppercase", isLong ? "text-market-up" : "text-market-down")}>
							{isLong ? t`Long` : t`Short`} · {leverageDisplay} {marginMode}
						</span>
					}
				/>
				<div className="text-right">
					<div className={cn("text-sm font-semibold tabular-nums", pnlClass)}>
						{formatUSD(unrealizedPnl, { signDisplay: "exceptZero" })}
					</div>
					<div className={cn("text-3xs tabular-nums", pnlClass)}>{formatPercent(p.returnOnEquity, 1)}</div>
				</div>
			</div>

			<div className="border-t border-stroke-weak/40">
				<div className="grid grid-cols-3 divide-x divide-stroke-weak/40">
					<MetricCell
						label={t`Size`}
						value={formatToken(absSize, { decimals: szDecimals, symbol: p.coin })}
						sub={formatUSD(p.positionValue, { compact: true })}
					/>
					<MetricCell label={t`Entry`} value={formatPrice(entryPx, { szDecimals })} />
					<MetricCell label={t`Mark`} value={formatPrice(markPx, { szDecimals })} />
				</div>
				<div className="grid grid-cols-3 divide-x divide-stroke-weak/40 border-t border-stroke-weak/40">
					<MetricCell label={t`Margin`} value={formatUSD(p.marginUsed)} />
					<MetricCell
						label={t`Liq Price`}
						value={formatPrice(p.liquidationPx, { szDecimals })}
						valueClass={liqIsNear ? "text-market-down" : undefined}
						warning={liqIsNear}
					/>
					<MetricCell label={t`Leverage`} value={leverageDisplay} sub={marginMode} />
				</div>
			</div>
		</div>
	);
}

interface MetricCellProps {
	label: string;
	value: string;
	sub?: string;
	valueClass?: string;
	warning?: boolean;
}

function MetricCell({ label, value, sub, valueClass, warning }: MetricCellProps) {
	return (
		<div className="px-3 py-2 bg-bg-base/50">
			<div className="text-3xs text-text-weak mb-0.5">{label}</div>
			<div className={cn("text-xs tabular-nums font-medium", valueClass)}>
				{warning && <WarningIcon className="size-3 text-market-down inline mr-0.5" />}
				{value}
			</div>
			{sub && <div className="text-3xs text-text-weak tabular-nums">{sub}</div>}
		</div>
	);
}
