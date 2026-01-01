import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function AccountPanel() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");

	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={setIsExpanded}
			className="shrink-0 flex flex-col bg-surface/30 border-t border-border/40"
		>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="w-full px-2 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer group border-b border-border/40"
					tabIndex={0}
					aria-label={isExpanded ? "Collapse account panel" : "Expand account panel"}
				>
					<div className="flex items-center gap-2">
						<span className="text-3xs uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
							Account
						</span>
						<ChevronUp
							className={cn(
								"size-3 text-muted-foreground transition-transform duration-200",
								!isExpanded && "rotate-180",
							)}
						/>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">Equity</span>
							<span className="text-sm font-semibold tabular-nums text-terminal-green terminal-glow-green">
								$12,450.23
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-4xs text-muted-foreground uppercase">PNL</span>
							<span className="text-2xs font-medium tabular-nums text-terminal-green">+$241.12</span>
						</div>
					</div>
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
				<div className="px-2 py-1 flex items-center gap-0.5 border-b border-border/40">
					{[
						{ key: "perps", label: "Perps" },
						{ key: "spot", label: "Spot" },
					].map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setActiveTab(tab.key as "perps" | "spot");
							}}
							className={cn(
								"px-2 py-1 text-4xs uppercase tracking-wider transition-colors",
								activeTab === tab.key
									? "text-terminal-cyan border-b border-terminal-cyan"
									: "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
							aria-label={tab.label}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className="p-2 space-y-2 max-h-48 overflow-y-auto">
					<div className="border border-border/40 divide-y divide-border/40 text-3xs">
						{[
							["Balance", "$11,203.12"],
							["Unrealized PNL", "+$241.12", "text-terminal-green"],
							["Margin Ratio", "12.3%"],
							["Maint. Margin", "$642.20"],
							["Leverage", "3.2x", "text-terminal-cyan"],
						].map(([k, v, cls]) => (
							<div key={k} className="flex items-center justify-between px-2 py-1.5">
								<span className="text-muted-foreground">{k}</span>
								<span className={cn("tabular-nums", cls)}>{v}</span>
							</div>
						))}
					</div>

					<div className="grid grid-cols-2 gap-1">
						<button
							type="button"
							className="py-1.5 text-3xs uppercase tracking-wider border border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 transition-colors"
							tabIndex={0}
							aria-label="Deposit"
						>
							Deposit
						</button>
						<button
							type="button"
							className="py-1.5 text-3xs uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
							tabIndex={0}
							aria-label="Withdraw"
						>
							Withdraw
						</button>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
