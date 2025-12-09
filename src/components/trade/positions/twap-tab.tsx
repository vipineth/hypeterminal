import { Timer } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { twapOrders } from "../lib";

export function TwapTab() {
	const activeOrders = twapOrders.filter((t) => t.status === "active");

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Timer className="size-3" />
				TWAP Orders
				<span className="text-terminal-cyan ml-auto tabular-nums">{activeOrders.length} Active</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				<ScrollArea className="h-full w-full">
					<Table>
						<TableHeader>
							<TableRow className="border-border/40 hover:bg-transparent">
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Total Size
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Executed
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Avg Price
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
									Progress
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Status</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{twapOrders.map((t) => {
								const isBuy = t.side === "buy";
								const progressPct = (t.executedSize / t.totalSize) * 100;
								return (
									<TableRow key={t.id} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
													)}
												>
													{t.side}
												</span>
												<span>{t.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{t.totalSize}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
											{t.executedSize}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											${t.avgPrice.toLocaleString()}
										</TableCell>
										<TableCell className="py-1.5">
											<div className="flex items-center gap-2">
												<div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
													<div
														className={cn(
															"h-full rounded-full",
															t.status === "completed" ? "bg-terminal-green" : "bg-terminal-cyan",
														)}
														style={{ width: `${progressPct}%` }}
													/>
												</div>
												<span className="text-4xs tabular-nums text-muted-foreground">{progressPct.toFixed(0)}%</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span
												className={cn(
													"text-4xs px-1 py-0.5 rounded-sm uppercase",
													t.status === "active" && "bg-terminal-cyan/20 text-terminal-cyan",
													t.status === "completed" && "bg-terminal-green/20 text-terminal-green",
													t.status === "cancelled" && "bg-terminal-red/20 text-terminal-red",
												)}
											>
												{t.status}
											</span>
										</TableCell>
										<TableCell className="text-right py-1.5">
											{t.status === "active" && (
												<button
													type="button"
													className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
													tabIndex={0}
													aria-label="Cancel TWAP order"
												>
													Cancel
												</button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
}
