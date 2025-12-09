import { History } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { history } from "../lib";

export function HistoryTab() {
	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<History className="size-3" />
				Trade History
				<span className="text-terminal-cyan ml-auto tabular-nums">{history.length} Trades</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				<ScrollArea className="h-full w-full">
					<Table>
						<TableHeader>
							<TableRow className="border-border/40 hover:bg-transparent">
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Type</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Price
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Size
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Fee
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									PNL
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Time
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{history.map((h) => {
								const isBuy = h.side === "buy";
								const date = new Date(h.executedAt);
								const timeStr = date.toLocaleTimeString("en-US", {
									hour: "2-digit",
									minute: "2-digit",
									hour12: false,
								});
								const dateStr = date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
								return (
									<TableRow key={h.id} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
													)}
												>
													{h.side}
												</span>
												<span>{h.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{h.type}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											${h.price.toLocaleString()}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{h.size}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-muted-foreground py-1.5">
											${h.fee.toFixed(2)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											{h.pnl !== 0 ? (
												<span className={cn(h.pnl >= 0 ? "text-terminal-green" : "text-terminal-red")}>
													{h.pnl >= 0 ? "+" : ""}${h.pnl.toFixed(2)}
												</span>
											) : (
												<span className="text-muted-foreground">-</span>
											)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums text-muted-foreground py-1.5">
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
			</div>
		</div>
	);
}
