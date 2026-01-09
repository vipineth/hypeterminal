import { t } from "@lingui/core/macro";
import { History } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { formatNumber, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubUserFills } from "@/lib/hyperliquid/hooks/subscription";
import { makePerpMarketKey } from "@/lib/hyperliquid/market-key";
import { parseNumber } from "@/lib/trade/numbers";
import { cn } from "@/lib/utils";
import { useMarketPrefsActions } from "@/stores/use-market-prefs-store";

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
			const isBuy = fill.side === "B";
			const date = new Date(fill.time);
			const timeStr = date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
			const dateStr = date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});

			const px = parseNumber(fill.px);
			const sz = parseNumber(fill.sz);
			const fee = parseNumber(fill.fee);
			const closedPnl = parseNumber(fill.closedPnl);
			const szDecimals = getSzDecimals(fill.coin) ?? 4;

			return {
				key: `${fill.hash}-${fill.tid}`,
				coin: fill.coin,
				sideLabel: isBuy ? t`buy` : t`sell`,
				sideClass: isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				typeLabel: fill.dir,
				priceText: Number.isFinite(px) ? formatUSD(px) : String(fill.px),
				sizeText: Number.isFinite(sz) ? formatNumber(sz, szDecimals) : String(fill.sz),
				feeText: Number.isFinite(fee) ? formatUSD(fee, { signDisplay: "exceptZero" }) : FALLBACK_VALUE_PLACEHOLDER,
				feeClass: Number.isFinite(fee) && fee < 0 ? "text-terminal-green" : "text-muted-foreground",
				pnlText:
					Number.isFinite(closedPnl) && closedPnl !== 0
						? formatUSD(closedPnl, { signDisplay: "exceptZero" })
						: FALLBACK_VALUE_PLACEHOLDER,
				pnlClass: closedPnl >= 0 ? "text-terminal-green" : "text-terminal-red",
				showPnl: Number.isFinite(closedPnl) && closedPnl !== 0,
				timeStr,
				dateStr,
			};
		});
	}, [fills, getSzDecimals]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<History className="size-3" />
				{t`Trade History`}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view trade history.`}
					</div>
				) : status === "subscribing" || status === "idle" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading trade history...`}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load trade history.`}</span>
						{error instanceof Error ? (
							<span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>
						) : null}
					</div>
				) : fills.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No fills found.`}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Type`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Price`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Fee`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`PNL`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => (
									<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
													{row.sideLabel}
												</span>
												<button
													type="button"
													onClick={() => setSelectedMarketKey(makePerpMarketKey(row.coin))}
													className="hover:underline hover:text-terminal-cyan transition-colors"
													aria-label={t`Switch to ${row.coin} market`}
												>
													{row.coin}
												</button>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{row.typeLabel}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.priceText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.sizeText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(row.feeClass)}>{row.feeText}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											{row.showPnl ? (
												<span className={cn(row.pnlClass)}>{row.pnlText}</span>
											) : (
												<span className="text-muted-foreground">{FALLBACK_VALUE_PLACEHOLDER}</span>
											)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-muted-foreground py-1.5">
											<div className="flex flex-col items-end">
												<span>{row.timeStr}</span>
												<span className="text-4xs">{row.dateStr}</span>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				)}
			</div>
		</div>
	);
}
