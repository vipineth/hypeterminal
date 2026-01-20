import { t } from "@lingui/core/macro";
import { Percent } from "lucide-react";
import { useMemo } from "react";
import { useConnection } from "wagmi";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatNumber, formatPercent, formatUSD } from "@/lib/format";
import { usePerpMarkets } from "@/lib/hyperliquid";
import { useSubUserFundings } from "@/lib/hyperliquid/hooks/subscription";
import { parseNumber, toNumberOrZero } from "@/lib/trade/numbers";

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
		return updates.reduce((acc, f) => acc + toNumberOrZero(f.usdc), 0);
	}, [updates]);

	const headerTotal =
		isConnected && status === "active"
			? formatUSD(totalFunding, { signDisplay: "exceptZero" })
			: FALLBACK_VALUE_PLACEHOLDER;
	const headerClass = totalFunding >= 0 ? "text-positive" : "text-negative";

	const tableRows = useMemo(() => {
		return updates.map((update, index) => {
			const szi = parseNumber(update.szi);
			const isLong = Number.isFinite(szi) ? szi > 0 : true;
			const szDecimals = getSzDecimals(update.coin) ?? 4;
			const rate = parseNumber(update.fundingRate);
			const usdc = parseNumber(update.usdc);

			return {
				key: `${update.coin}-${update.time}-${index}`,
				coin: update.coin,
				isLong,
				positionSize: Number.isFinite(szi) ? Math.abs(szi) : null,
				szDecimals,
				rate,
				usdc,
				time: update.time,
			};
		});
	}, [updates, getSzDecimals]);

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view funding payments.`}</Placeholder>;
		if (status === "subscribing" || status === "idle")
			return <Placeholder>{t`Loading funding history...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load funding history.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-muted-fg">{error.message}</span>}
				</Placeholder>
			);
		}
		if (updates.length === 0) return <Placeholder>{t`No funding payments found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-fg mb-1.5 flex items-center gap-2">
				<Percent className="size-3" />
				{t`Funding Payments`}
				<span className={cn("ml-auto tabular-nums", headerClass)}>{headerTotal}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-bg/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">
										{t`Asset`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Position`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Rate`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Payment`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Time`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tableRows.map((row) => {
									const sideClass = row.isLong
										? "bg-positive/20 text-positive"
										: "bg-negative/20 text-negative";
									const rateClass = row.rate >= 0 ? "text-positive" : "text-negative";
									const paymentClass = row.usdc >= 0 ? "text-positive" : "text-negative";
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
														{row.isLong ? t`Long` : t`Short`}
													</span>
													<span>{row.coin}</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatNumber(row.positionSize, row.szDecimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={rateClass}>
													{formatPercent(row.rate, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
												</span>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												<span className={paymentClass}>{formatUSD(row.usdc, { signDisplay: "exceptZero" })}</span>
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
