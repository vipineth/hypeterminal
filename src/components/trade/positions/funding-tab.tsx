import { Percent } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fundingPayments } from "../lib";

export function FundingTab() {
	const totalFunding = fundingPayments.reduce((acc, f) => acc + f.payment, 0);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Percent className="size-3" />
				Funding Payments
				<span className={cn("ml-auto tabular-nums", totalFunding >= 0 ? "text-terminal-green" : "text-terminal-red")}>
					{totalFunding >= 0 ? "+" : ""}${totalFunding.toFixed(2)}
				</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				<ScrollArea className="h-full w-full">
					<Table>
						<TableHeader>
							<TableRow className="border-border/40 hover:bg-transparent">
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Position
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Rate
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Payment
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Time
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{fundingPayments.map((f, idx) => {
								const isLong = f.positionSize > 0;
								const date = new Date(f.timestamp);
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
									<TableRow key={`${f.coin}-${f.timestamp}-${idx}`} className="border-border/40 hover:bg-accent/30">
										<TableCell className="text-2xs font-medium py-1.5">
											<div className="flex items-center gap-1.5">
												<span
													className={cn(
														"text-4xs px-1 py-0.5 rounded-sm uppercase",
														isLong
															? "bg-terminal-green/20 text-terminal-green"
															: "bg-terminal-red/20 text-terminal-red",
													)}
												>
													{isLong ? "Long" : "Short"}
												</span>
												<span>{f.coin}</span>
											</div>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											{Math.abs(f.positionSize)}
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(f.rate >= 0 ? "text-terminal-green" : "text-terminal-red")}>
												{(f.rate * 100).toFixed(4)}%
											</span>
										</TableCell>
										<TableCell className="text-2xs text-right tabular-nums py-1.5">
											<span className={cn(f.payment >= 0 ? "text-terminal-green" : "text-terminal-red")}>
												{f.payment >= 0 ? "+" : ""}${f.payment.toFixed(2)}
											</span>
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
