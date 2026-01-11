import { t } from "@lingui/core/macro";
import { Percent } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/interface";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubUserFundings } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber } from "@/lib/trade/numbers";

export function FundingTab() {
	const { address, isConnected } = useConnection();
	const {
		data: fundingEvent,
		status,
		error,
	} = useSubUserFundings({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const data = fundingEvent?.fundings;
	const { getSzDecimals } = usePerpMarkets();

	const updates = useMemo(() => {
		const raw = data ?? [];
		const sorted = [...raw].sort((a, b) => b.time - a.time);
		return sorted.slice(0, 200);
	}, [data]);

	const totalFunding = useMemo(() => {
		return updates.reduce((acc, f) => {
			const usdc = parseNumber(f.usdc);
			return acc + (Number.isFinite(usdc) ? usdc : 0);
		}, 0);
	}, [updates]);

	const headerTotal =
		isConnected && status === "active"
			? formatUSD(totalFunding, { signDisplay: "exceptZero" })
			: FALLBACK_VALUE_PLACEHOLDER;
	const headerClass = totalFunding >= 0 ? "text-terminal-green" : "text-terminal-red";

	const tableRows = useMemo(() => {
		return updates.map((update, index) => {
			const szi = parseNumber(update.szi);
			const isLong = Number.isFinite(szi) ? szi > 0 : true;
			const positionSize = Number.isFinite(szi) ? Math.abs(szi) : Number.NaN;
			const szDecimals = getSzDecimals(update.coin) ?? 4;

			const rate = parseNumber(update.fundingRate);
			const usdc = parseNumber(update.usdc);

			const date = new Date(update.time);
			const timeStr = date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			});
			const dateStr = date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});

			return {
				key: `${update.coin}-${update.time}-${index}`,
				coin: update.coin,
				sideLabel: isLong ? t`Long` : t`Short`,
				sideClass: isLong ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
				positionText: Number.isFinite(positionSize)
					? formatNumber(positionSize, szDecimals)
					: FALLBACK_VALUE_PLACEHOLDER,
				rateText: Number.isFinite(rate)
					? formatPercent(rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
					: FALLBACK_VALUE_PLACEHOLDER,
				rateClass: rate >= 0 ? "text-terminal-green" : "text-terminal-red",
				paymentText: Number.isFinite(usdc)
					? formatUSD(usdc, { signDisplay: "exceptZero" })
					: FALLBACK_VALUE_PLACEHOLDER,
				paymentClass: usdc >= 0 ? "text-terminal-green" : "text-terminal-red",
				timeStr,
				dateStr,
			};
		});
	}, [updates, getSzDecimals]);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Percent className="size-3" />
				{t`Funding Payments`}
				<span className={cn("ml-auto tabular-nums", headerClass)}>{headerTotal}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				{!isConnected ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Connect your wallet to view funding payments.`}
					</div>
				) : status === "subscribing" || status === "idle" ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`Loading funding history...`}
					</div>
				) : status === "error" ? (
					<div className="h-full w-full flex flex-col items-center justify-center px-2 py-6 text-3xs text-terminal-red/80">
						<span>{t`Failed to load funding history.`}</span>
						{error instanceof Error ? (
							<span className="mt-1 text-4xs text-muted-foreground">{error.message}</span>
						) : null}
					</div>
				) : updates.length === 0 ? (
					<div className="h-full w-full flex items-center justify-center px-2 py-6 text-3xs text-muted-foreground">
						{t`No funding payments found.`}
					</div>
				) : (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Position`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Rate`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
										{t`Payment`}
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
												<span>{row.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{row.positionText}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(row.rateClass)}>{row.rateText}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(row.paymentClass)}>{row.paymentText}</span>
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
