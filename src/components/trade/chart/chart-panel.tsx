import {
	Activity,
	ArrowDownUp,
	ArrowUpDown,
	BarChart2,
	CandlestickChart,
	ChevronDown,
	EllipsisVertical,
	Flame,
	LayoutGrid,
	Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { markets } from "../lib";
import { StatBlock } from "./stat-block";
import { ToolRailButton } from "./tool-rail-button";

export function ChartPanel() {
	return (
		<div className="h-full flex flex-col overflow-hidden">
			<div className="px-2 py-1.5 border-b border-border/60 bg-card/30">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-6 gap-1.5 text-xs font-semibold px-2">
									<span className="text-terminal-amber">AAVE</span>
									<span className="text-muted-foreground">/USDC</span>
									<ChevronDown className="size-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-40 font-mono text-xs">
								{markets.slice(0, 6).map((m) => (
									<DropdownMenuItem key={m.symbol}>{m.symbol}</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<Separator orientation="vertical" className="mx-1 h-4" />
						<div className="hidden md:flex items-center gap-4 text-[10px]">
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
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
							tabIndex={0}
							aria-label="Search"
						>
							<Search className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
							tabIndex={0}
							aria-label="Layout"
						>
							<LayoutGrid className="size-3.5" />
						</button>
						<button
							type="button"
							className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
							tabIndex={0}
							aria-label="More"
						>
							<EllipsisVertical className="size-3.5" />
						</button>
					</div>
				</div>
			</div>

			<div className="flex items-stretch min-h-0 flex-1">
				<div className="hidden md:flex flex-col gap-0.5 py-1.5 px-0.5 border-r border-border/40 bg-card/20">
					{[
						{ Icon: CandlestickChart, id: "candlestick" },
						{ Icon: BarChart2, id: "bar" },
						{ Icon: ArrowUpDown, id: "updown" },
						{ Icon: ArrowDownUp, id: "downup" },
						{ Icon: Activity, id: "activity" },
					].map(({ Icon, id }) => (
						<ToolRailButton key={id} Icon={Icon} />
					))}
				</div>

				<div className="flex-1 min-h-0 flex flex-col">
					<div className="flex items-center gap-1 p-1.5 border-b border-border/40 bg-card/20">
						<ToggleGroup type="single" defaultValue="1h" className="gap-0.5">
							{["5m", "15m", "1h", "4h", "1D"].map((tf) => (
								<ToggleGroupItem
									key={tf}
									value={tf}
									className="px-2 py-0.5 text-[10px] h-6 data-[state=on]:bg-terminal-cyan/20 data-[state=on]:text-terminal-cyan"
									aria-label={tf}
								>
									{tf}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
						<Separator orientation="vertical" className="mx-1 h-4" />
						<Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
							Indicators
						</Button>
						<Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
							Settings
						</Button>
					</div>

					<div className="flex-1 min-h-0 grid place-items-center text-muted-foreground text-xs select-none terminal-grid">
						<div className="flex flex-col items-center gap-2">
							<CandlestickChart className="size-8 text-muted-foreground/30" />
							<span className="text-[10px] uppercase tracking-wider">Chart Area</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

