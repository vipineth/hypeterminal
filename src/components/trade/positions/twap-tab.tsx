import { t } from "@lingui/core/macro";
import { Timer } from "lucide-react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FALLBACK_VALUE_PLACEHOLDER } from "@/config/constants";
import { cn } from "@/lib/cn";
import { formatNumber, formatPrice } from "@/lib/format";
import { useMarkets } from "@/lib/hyperliquid";
import { useSubUserTwapHistory } from "@/lib/hyperliquid/hooks/subscription";
import { calc, parseNumber } from "@/lib/trade/numbers";
import { useMarketActions } from "@/stores/use-market-store";

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

export function TwapTab() {
	const { address, isConnected } = useConnection();
	const { setSelectedMarket } = useMarketActions();
	const {
		data: twapEvent,
		status,
		error,
	} = useSubUserTwapHistory({ user: address ?? "0x0" }, { enabled: isConnected && !!address });
	const markets = useMarkets();

	const orders = twapEvent?.history ?? [];
	const activeCount = orders.filter((o) => o.status.status === "activated").length;

	const headerCount = isConnected ? `${activeCount} ${t`Active`}` : FALLBACK_VALUE_PLACEHOLDER;

	function renderPlaceholder() {
		if (!isConnected) return <Placeholder>{t`Connect your wallet to view TWAP orders.`}</Placeholder>;
		if (status === "subscribing" || status === "idle") return <Placeholder>{t`Loading TWAP orders...`}</Placeholder>;
		if (status === "error") {
			return (
				<Placeholder variant="error">
					<span>{t`Failed to load TWAP history.`}</span>
					{error instanceof Error && <span className="mt-1 text-4xs text-muted-fg">{error.message}</span>}
				</Placeholder>
			);
		}
		if (orders.length === 0) return <Placeholder>{t`No TWAP orders found.`}</Placeholder>;
		return null;
	}

	const placeholder = renderPlaceholder();

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-fg mb-1.5 flex items-center gap-2">
				<Timer className="size-3" />
				{t`TWAP Orders`}
				<span className="text-info ml-auto tabular-nums">{headerCount}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-bg/50">
				{placeholder ?? (
					<ScrollArea className="h-full w-full">
						<Table>
							<TableHeader>
								<TableRow className="border-border/40 hover:bg-transparent">
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">{t`Asset`}</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Total Size`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Executed`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Avg Price`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">
										{t`Progress`}
									</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 h-7">{t`Status`}</TableHead>
									<TableHead className="text-4xs uppercase tracking-wider text-muted-fg/70 text-right h-7">
										{t`Actions`}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orders.map((order) => {
									const isBuy = order.state.side === "B";
									const sideClass = isBuy ? "bg-positive/20 text-positive" : "bg-negative/20 text-negative";
									const totalSize = parseNumber(order.state.sz);
									const executedSize = parseNumber(order.state.executedSz);
									const avgPrice = calc.divide(order.state.executedNtl, order.state.executedSz);
									const rawPct = calc.percentOf(executedSize, totalSize) ?? 0;
									const progressPct = Math.max(0, Math.min(100, rawPct));
									const szDecimals = markets.szDecimals(order.state.coin);
									const status = order.status.status;
									const statusLabel =
										status === "activated"
											? t`active`
											: status === "finished"
												? t`completed`
												: status === "terminated"
													? t`cancelled`
													: status;
									const key =
										typeof order.twapId === "number"
											? order.twapId
											: `${order.state.coin}-${order.state.timestamp}-${order.time}`;

									return (
										<TableRow key={key} className="border-border/40 hover:bg-accent/30">
											<TableCell className="text-2xs font-medium py-1.5">
												<div className="flex items-center gap-1.5">
													<span className={cn("text-4xs px-1 py-0.5 rounded-sm uppercase", sideClass)}>
														{isBuy ? t`buy` : t`sell`}
													</span>
													<Button
														variant="link"
														size="none"
														onClick={() => setSelectedMarket(order.state.coin)}
														aria-label={t`Switch to ${markets.displayName(order.state.coin)} market`}
													>
														{markets.displayName(order.state.coin)}
													</Button>
												</div>
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatNumber(totalSize, szDecimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums text-warning py-1.5">
												{formatNumber(executedSize, szDecimals)}
											</TableCell>
											<TableCell className="text-2xs text-right tabular-nums py-1.5">
												{formatPrice(avgPrice, { szDecimals })}
											</TableCell>
											<TableCell className="py-1.5">
												<div className="flex items-center gap-2">
													<div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
														<div
															className={cn("h-full rounded-full", status === "finished" ? "bg-positive" : "bg-info")}
															style={{ width: `${progressPct}%` }}
														/>
													</div>
													<span className="text-4xs tabular-nums text-muted-fg">{progressPct.toFixed(0)}%</span>
												</div>
											</TableCell>
											<TableCell className="text-2xs py-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														status === "activated" && "bg-info/20 text-info",
														status === "finished" && "bg-positive/20 text-positive",
														(status === "terminated" || status === "error") && "bg-negative/20 text-negative",
													)}
												>
													{statusLabel}
												</span>
											</TableCell>
											<TableCell className="text-right py-1.5">
												{status === "activated" && (
													<Button variant="danger" size="xs" aria-label={t`Cancel TWAP order`}>
														{t`Cancel`}
													</Button>
												)}
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
