import { ClientOnly } from "@tanstack/react-router";
import { ChevronDown, EllipsisVertical, Flame, LayoutGrid, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/providers/theme";
import { markets } from "../lib";
import { StatBlock } from "./stat-block";
import { TradingViewChart } from "./trading-view-chart";

export function ChartPanel() {
	const { theme } = useTheme();
	const [symbol, setSymbol] = useState("AAVE/USDC");

	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-1.5 border-b border-border/60 bg-surface/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-6 gap-1.5 text-xs font-semibold px-2">
									<span className="text-terminal-amber">{symbol.split("/")[0]}</span>
									<span className="text-muted-foreground">/{symbol.split("/")[1]}</span>
									<ChevronDown className="size-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-40 font-mono text-xs">
								{markets.slice(0, 6).map((m) => (
									<DropdownMenuItem key={m.symbol} onSelect={() => setSymbol(m.symbol)}>
										{m.symbol}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<Separator orientation="vertical" className="mx-1 h-4" />
						<div className="hidden md:flex items-center gap-4 text-3xs">
							<StatBlock label="MARK" value="102.45" valueClass="text-terminal-amber terminal-glow-amber" />
							<StatBlock label="ORACLE" value="102.42" />
							<StatBlock label="24H" value="+2.31%" valueClass="text-terminal-green" />
							<StatBlock label="VOL" value="$42.3M" />
							<StatBlock label="OI" value="$120.1M" />
							<div className="flex items-center gap-1">
								<Flame className="size-3 text-terminal-red" />
								<span className="text-muted-foreground">0.01%</span>
								<span className="text-muted-foreground/60">/ 02:34</span>
							</div>
						</div>
					</div>
					<div className="hidden md:flex items-center gap-0.5">
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="Search"
						>
							<Search className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="Layout"
						>
							<LayoutGrid className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
							tabIndex={0}
							aria-label="More"
						>
							<EllipsisVertical className="size-3.5" />
						</button>
					</div>
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<ClientOnly>
					<TradingViewChart symbol={symbol} theme={theme === "dark" ? "dark" : "light"} />
				</ClientOnly>
			</div>
		</div>
	);
}
