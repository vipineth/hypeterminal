import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function TradesView() {
	const trades = Array.from({ length: 30 }).map((_, i) => {
		const timestamp = Date.now() - i * 2000;
		return {
			id: `trade-${timestamp}-${i}`,
			time: new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
			price: (102.4 + Math.random() * 0.1).toFixed(2),
			size: (Math.random() * 5).toFixed(3),
			side: Math.random() > 0.5 ? "buy" : ("sell" as "buy" | "sell"),
		};
	});

	return (
		<div className="flex-1 min-h-0 flex flex-col">
			<div className="grid grid-cols-3 gap-2 px-2 py-1 text-4xs uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
				<div>Time</div>
				<div className="text-right">Price</div>
				<div className="text-right">Size</div>
			</div>
			<ScrollArea className="flex-1">
				<div className="px-2 py-1 space-y-px">
					{trades.map((t) => (
						<div key={t.id} className="grid grid-cols-3 gap-2 text-2xs tabular-nums py-0.5 hover:bg-accent/30">
							<div className="text-muted-foreground/70">{t.time}</div>
							<div className={cn("text-right", t.side === "buy" ? "text-terminal-green" : "text-terminal-red")}>
								{t.price}
							</div>
							<div className="text-right text-muted-foreground">{t.size}</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
