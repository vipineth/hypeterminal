import { Wallet } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { balances } from "../lib";

export function BalancesTab() {
	const totalValue = balances.reduce((acc, b) => acc + b.usdValue, 0);

	return (
		<div className="flex-1 min-h-0 flex flex-col p-2">
			<div className="text-3xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
				<Wallet className="size-3" />
				Account Balances
				<span className="text-terminal-cyan ml-auto tabular-nums">${totalValue.toLocaleString()}</span>
			</div>
			<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
				<ScrollArea className="h-full w-full">
					<Table>
						<TableHeader>
							<TableRow className="border-border/40 hover:bg-transparent">
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 h-7">Asset</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Available
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									In Order
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									Total
								</TableHead>
								<TableHead className="text-4xs uppercase tracking-wider text-muted-foreground/70 text-right h-7">
									USD Value
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{balances.map((b) => (
								<TableRow key={b.asset} className="border-border/40 hover:bg-accent/30">
									<TableCell className="text-2xs font-medium py-1.5">
										<span className="text-terminal-cyan">{b.asset}</span>
									</TableCell>
									<TableCell className="text-2xs text-right tabular-nums py-1.5">
										{b.available.toLocaleString()}
									</TableCell>
									<TableCell className="text-2xs text-right tabular-nums text-terminal-amber py-1.5">
										{b.inOrder.toLocaleString()}
									</TableCell>
									<TableCell className="text-2xs text-right tabular-nums py-1.5">{b.total.toLocaleString()}</TableCell>
									<TableCell className="text-2xs text-right tabular-nums text-terminal-green py-1.5">
										${b.usdValue.toLocaleString()}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</div>
		</div>
	);
}
