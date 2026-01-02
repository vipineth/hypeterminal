import { ListOrdered } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER, UI_TEXT } from "@/constants/app";
import { cn } from "@/lib/utils";
import { formatNumber, formatUSD } from "@/lib/format";
import { useOpenOrders } from "@/hooks/hyperliquid/use-open-orders";
import { parseNumber } from "@/lib/trade/numbers";
import { useConnection } from "wagmi";

const ORDERS_TEXT = UI_TEXT.ORDERS_TAB;

export function OrdersTab() {
	const { address, isConnected } = useConnection();
	const { data, status, error } = useOpenOrders({ user: isConnected ? address : undefined });

	const openOrders = useMemo(() => data ?? [], [data]);
	const headerCount = isConnected ? openOrders.length : FALLBACK_VALUE_PLACEHOLDER;

	const orderRows = useMemo(() => {
		return openOrders.map((order) => {
			const isBuy = order.side === "B";
			const origSz = parseNumber(order.origSz);
			const remaining = parseNumber(order.sz);
			const filled =
				Number.isFinite(origSz) && Number.isFinite(remaining) ? Math.max(0, origSz - remaining) : Number.NaN;
			const fillPct = Number.isFinite(origSz) && origSz !== 0 && Number.isFinite(filled) ? (filled / origSz) * 100 : 0;
			const limitPx = parseNumber(order.limitPx);

			return {
				key: order.oid,
				coin: order.coin,
				sideLabel: isBuy ? ORDERS_TEXT.SIDE_BUY : ORDERS_TEXT.SIDE_SELL,
				sideClass: isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				typeLabel: order.reduceOnly ? ORDERS_TEXT.TYPE_LIMIT_RO : ORDERS_TEXT.TYPE_LIMIT,
				priceText: Number.isFinite(limitPx) ? formatUSD(limitPx, { compact: false }) : String(order.limitPx),
				sizeText: Number.isFinite(origSz) ? formatNumber(origSz, 4) : String(order.origSz),
				filledText: Number.isFinite(filled) ? formatNumber(filled, 4) : FALLBACK_VALUE_PLACEHOLDER,
				hasFilled: Number.isFinite(filled) && filled > 0,
				fillPctText: `${fillPct.toFixed(0)}%`,
				statusLabel: ORDERS_TEXT.STATUS_OPEN,
			};
		});
	}, [openOrders]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<ListOrdered className="size-3" />
				{ORDERS_TEXT.TITLE}
				<span className="text-terminal-cyan ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{ORDERS_TEXT.CONNECT}
					</div>
				) : status === "pending" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{ORDERS_TEXT.LOADING}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{ORDERS_TEXT.FAILED}</span>
						{error instanceof Error ? <span className="mt-1 text-4xs text-muted-foreground">{error.message}</span> : null}
					</div>
				) : openOrders.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{ORDERS_TEXT.EMPTY}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{ORDERS_TEXT.HEADER_ASSET}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{ORDERS_TEXT.HEADER_TYPE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{ORDERS_TEXT.HEADER_PRICE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{ORDERS_TEXT.HEADER_SIZE}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{ORDERS_TEXT.HEADER_FILLED}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{ORDERS_TEXT.HEADER_STATUS}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{ORDERS_TEXT.HEADER_ACTIONS}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orderRows.map((row) => (
									<TableRow key={row.key} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", row.sideClass)}>
													{row.sideLabel}
												</span>
												<span>{row.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{row.typeLabel}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.priceText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.sizeText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(row.hasFilled && "text-terminal-amber")}>
												{row.filledText} ({row.fillPctText})
											</span>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-terminal-cyan/20 text-terminal-cyan">
												{row.statusLabel}
											</span>
										</TableCell>
										<TableCell className="text-right py-1.5">
											<button
												type="button"
												className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
												tabIndex={0}
												aria-label={ORDERS_TEXT.ARIA_CANCEL}
											>
												{ORDERS_TEXT.ACTION_CANCEL}
											</button>
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
