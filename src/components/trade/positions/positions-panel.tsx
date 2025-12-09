import { Circle } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { positions } from "../lib";

export function PositionsPanel() {
	return (
		<div className="h-full flex flex-col overflow-hidden bg-card/20">
			<Tabs defaultValue="positions" className="flex-1 min-h-0 flex flex-col">
				<div className="px-2 pt-1.5 border-b border-border/40">
					<div className="flex items-center gap-0.5 overflow-x-auto pb-1.5">
						{["Balances", "Positions", "Orders", "TWAP", "History", "Funding"].map((k, idx) => (
							<button
								key={k}
								type="button"
								className={cn(
									"px-2 py-1 text-3xs uppercase tracking-wider whitespace-nowrap transition-colors",
									idx === 1
										? "text-terminal-cyan border-b border-terminal-cyan"
										: "text-muted-foreground hover:text-foreground",
								)}
								tabIndex={0}
								aria-label={k}
							>
								{k}
							</button>
						))}
					</div>
				</div>
				<TabsContent value="positions" className="flex-1 min-h-0 flex flex-col p-2">
					<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
						<Circle className="size-1.5 fill-terminal-green text-terminal-green" />
						Active Positions
						<span className="text-terminal-cyan ml-auto tabular-nums">2</span>
					</div>
					<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
						<ScrollArea className="h-full w-full">
							<Table>
								<TableHeader>
									<TableRow className="border-border/40 hover:bg-transparent">
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">
											Asset
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Size
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Value
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Entry
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Mark
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											PNL
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Liq
										</TableHead>
										<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{positions.map((p) => {
										const isLong = p.size > 0;
										return (
											<TableRow key={`${p.coin}-${p.entryPrice}`} className="border-border/40 hover:bg-accent/30">
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
														<span>{p.coin}</span>
													</div>
												</TableCell>
												<TableCell className="text-2xs text-right tabular-nums py-1.5">
													{Math.abs(p.size).toFixed(2)}
												</TableCell>
												<TableCell className="text-2xs text-right tabular-nums py-1.5">
													${p.positionValue.toFixed(2)}
												</TableCell>
												<TableCell className="text-2xs text-right tabular-nums py-1.5">
													${p.entryPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
													${p.markPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-right py-1.5">
													<div
														className={cn(
															"text-2xs tabular-nums",
															p.pnl >= 0 ? "text-terminal-green" : "text-terminal-red",
														)}
													>
														{p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
														<span className="text-muted-foreground ml-1">({p.roePct.toFixed(1)}%)</span>
													</div>
												</TableCell>
												<TableCell className="text-2xs text-right tabular-nums text-terminal-red/70 py-1.5">
													${p.liqPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-right py-1.5">
													<div className="flex justify-end gap-1">
														<button
															type="button"
															className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
															tabIndex={0}
															aria-label="Close position"
														>
															Close
														</button>
														<button
															type="button"
															className="px-1.5 py-0.5 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/60 hover:text-terminal-cyan transition-colors"
															tabIndex={0}
															aria-label="Set TP/SL"
														>
															TP/SL
														</button>
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
				</TabsContent>
			</Tabs>
		</div>
	);
}
