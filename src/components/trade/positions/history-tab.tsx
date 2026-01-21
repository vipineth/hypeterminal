import { t } from "@lingui/core/macro";
import { History } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatNumber, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubUserFills } from "@/lib/hyperliquid/hooks/subscription";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import { parseNumber } from "@/lib/trade/numbers";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";

interface PlaceholderProps {
	children: React.ReactNode;
	variant?: "error";
}

function Placeholder({ children, variant }: PlaceholderProps) {
	return (
		<div
			className={cn(
				"h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs",
				variant === "error" ? "text-negative/80" : "text-muted-fg",
			)}
		>
			{children}
		</div>
	);
}

export function HistoryTab() {
	const { address, isConnected } = useConnection();
	const { setSelectedMarketKey } = useMarketPrefsActions();
	const {
		data: fillsEvent,
		status,
		error,
	} = useSubUserFills({ user: address ?? "0x0", aggregateByTime: true }, { enabled: isConnected && !!address });
	const data = fillsEvent?.fills;
	const { getSzDecimals } = usePerpMarkets();

	const fills = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.time - a.time);
		return sorted.slice(0, 200);
	}, [data]);

	const headerCount = isConnected ? `${fills.length} ${t`Trades`}` : FALLBACK_VALUE_PLACEHOLDER;

	const tableRows = useMemo(() => {
		return fills.map((fill) => {
			const fee = parseNumber(fill.fee);
			const closedPnl = parseNumber(fill.closedPnl);
			const szDecimals = getSzDecimals(fill.coin) ?? 4;

			return {
				key: `${fill.hash}-${fill.tid}`,
				coin: fill.coin,
				isBuy: fill.side === "B",
				dir: fill.dir,
				px: fill.px,
				sz: fill.sz,
				szDecimals,
				fee,
				closedPnl,
				time: fill.time,
			};
		});
	}, [fills, getSzDecimals]);

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view trade history.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading trade history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load trade history.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-muted-fg">{error.message}</span>}
				</Placeholder>
			);
		}
		if (fills.length === 0) return <Placeholder>{t`No fills found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-fg mb-1.5 flex items-center gap-2">
				<History className="size-3" />
				{t`Trade History`}
				<span className="text-info ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-bg/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">{t`Type`}</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Fee`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => {
									const sideClass = row.isBuy ? "bg-positive/20 text-positive" : "bg-negative/20 text-negative";
									const feeClass = row.fee < 0 ? "text-positive" : "text-muted-fg";
									const showPnl = Number.isFinite(row.closedPnl) && row.closedPnl !== 0;
									const pnlClass = row.closedPnl >= 0 ? "text-positive" : "text-negative";
									const date = new Date(row.time);
									const timeStr = date.toLocaleTimeString("en-US", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									});
									const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

									return (
										<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideClass)}>
														{row.isBuy ? t`buy` : t`sell`}
													</span>
													<Button
														variant="link"
														size="none"
														onClick={() => setSelectedMarketKey(makePerpMarketKey(row.coin))}
														aria-label={t`Switch to ${row.coin} market`}
													>
														{row.coin}
													</Button>
												</div>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{row.dir}</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">{formatUSD(row.px)}</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatNumber(row.sz, row.szDecimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={feeClass}>{formatUSD(row.fee, { signDisplay: "exceptZero" })}</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{showPnl ? (
													<span className={pnlClass}>{formatUSD(row.closedPnl, { signDisplay: "exceptZero" })}</span>
												) : (
													<span className="text-muted-fg">{FALLBACK_VALUE_PLACEHOLDER}</span>
												)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-muted-fg py-1.5">
												<div className="flex flex-col items-end">
													<span>{timeStr}</span>
													<span className="text-4xs">{dateStr}</span>
												</div>
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
		</div>
	);
}
