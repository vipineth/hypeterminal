import { ListOrdered } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { orders } from "../lib";

export function OrdersTab() {
	const openOrders = orders.filter((o) => o.status !== "cancelled");

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<ListOrdered className="size-3" />
				Open Orders
				<span className="text-terminal-cyan ml-auto tabular-nums">{openOrders.length}</span>
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
									Filled
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Status</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{openOrders.map((o) => {
								const isBuy = o.side === "buy";
								const fillPct = (o.filled / o.size) * 100;
								return (
									<TableRow key={o.id} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														isBuy ? "bg-terminal-green/20 text-terminal-green" : "bg-terminal-red/20 text-terminal-red",
													)}
												>
													{o.side}
												</span>
												<span>{o.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span className="text-4xs px-1 py-0.5 rounded-sm uppercase bg-accent/50">{o.type}</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											${o.price.toLocaleString()}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">{o.size}</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(o.filled > 0 && "text-terminal-amber")}>
												{o.filled} ({fillPct.toFixed(0)}%)
											</span>
										</TableCell>
										<TableCell className="text-2xs py-1.5">
											<span
												className={cn(
													"text-4xs px-1 py-0.5 rounded-sm uppercase",
													o.status === "open" && "bg-terminal-cyan/20 text-terminal-cyan",
													o.status === "partial" && "bg-terminal-amber/20 text-terminal-amber",
												)}
											>
												{o.status}
											</span>
										</TableCell>
										<TableCell className="text-right py-1.5">
											<button
												type="button"
												className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
												tabIndex={0}
												aria-label="Cancel order"
											>
												Cancel
											</button>
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
