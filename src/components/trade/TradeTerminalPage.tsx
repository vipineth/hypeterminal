import { ClientOnly } from "@tanstack/react-router";
import {
	Activity,
	ArrowDownUp,
	ArrowUpDown,
	BarChart2,
	Bell,
	CandlestickChart,
	ChevronDown,
	ChevronUp,
	Circle,
	Cog,
	EllipsisVertical,
	Flame,
	LayoutGrid,
	type LucideIcon,
	Moon,
	Search,
	Sun,
	Terminal,
	TrendingDown,
	TrendingUp,
	Wifi,
	Zap,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme";

type Market = {
	symbol: string;
	base: string;
	changePct: number;
	price: number;
	volume: string;
};

type OrderBookRow = {
	price: number;
	size: number;
	total: number;
};

type PositionRow = {
	coin: string;
	size: number;
	positionValue: number;
	entryPrice: number;
	markPrice: number;
	pnl: number;
	roePct: number;
	liqPrice: number;
	margin: number;
	funding: number;
};

const markets: Market[] = [
	{ symbol: "AAVE-USDC", base: "AAVE", changePct: 2.34, price: 102.45, volume: "42.3M" },
	{ symbol: "BTC-USDC", base: "BTC", changePct: -0.84, price: 43521.3, volume: "892.1M" },
	{ symbol: "ETH-USDC", base: "ETH", changePct: 1.12, price: 2341.8, volume: "421.5M" },
	{ symbol: "SOL-USDC", base: "SOL", changePct: 3.41, price: 98.72, volume: "156.2M" },
	{ symbol: "LINK-USDC", base: "LINK", changePct: -1.09, price: 14.23, volume: "32.1M" },
	{ symbol: "OP-USDC", base: "OP", changePct: 0.6, price: 2.14, volume: "18.4M" },
	{ symbol: "ARB-USDC", base: "ARB", changePct: -2.1, price: 1.23, volume: "24.6M" },
	{ symbol: "TIA-USDC", base: "TIA", changePct: 4.21, price: 8.92, volume: "12.8M" },
];

function genBookRows(count: number, start: number, step: number, dir: "up" | "down"): OrderBookRow[] {
	return Array.from({ length: count }).map((_, i) => {
		const price = dir === "up" ? start + i * step : start - i * step;
		const size = Number((Math.random() * 12 + 0.1).toFixed(3));
		const total = Number((size * (Math.random() * 3 + 1)).toFixed(3));
		return { price: Number(price.toFixed(2)), size, total };
	});
}

const asks: OrderBookRow[] = genBookRows(20, 102.5, 0.05, "up");
const bids: OrderBookRow[] = genBookRows(20, 102.45, 0.05, "down");

const positions: PositionRow[] = [
	{
		coin: "AAVE",
		size: 12.3,
		positionValue: 1254.23,
		entryPrice: 98.32,
		markPrice: 102.45,
		pnl: 51.12,
		roePct: 9.2,
		liqPrice: 72.12,
		margin: 213.4,
		funding: -0.42,
	},
	{
		coin: "ETH",
		size: -0.84,
		positionValue: 2864.12,
		entryPrice: 3102.12,
		markPrice: 3056.8,
		pnl: 39.41,
		roePct: 1.6,
		liqPrice: 3502.0,
		margin: 562.3,
		funding: 0.12,
	},
];

function usePersistentLayout(key: string, fallback: number[]) {
	const [layout, setLayout] = useState<number[]>(fallback);
	useEffect(() => {
		try {
			const stored = localStorage.getItem(key);
			if (stored) {
				const arr = JSON.parse(stored) as number[];
				if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
					setLayout(arr);
				}
			}
		} catch {}
	}, [key]);

	const onLayout = (sizes: number[]) => {
		setLayout(sizes);
		try {
			localStorage.setItem(key, JSON.stringify(sizes));
		} catch {}
	};

	return { layout, onLayout } as const;
}

export function TradeTerminalPage() {
	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono terminal-scanlines">
			<TopNav />
			<TickerStrip />
			<MainWorkspace />
			<FooterBar />
		</div>
	);
}

function TopNav() {
	return (
		<header className="h-11 border-b border-border/60 px-2 flex items-center justify-between bg-card/40">
			<div className="flex items-center gap-2 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-terminal-green/20 border border-terminal-green/40 flex items-center justify-center">
						<Terminal className="size-3 text-terminal-green" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-terminal-cyan">
						HYPER<span className="text-foreground">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
				<nav className="hidden lg:flex items-center text-[10px] uppercase tracking-wider">
					{["Trade", "Vaults", "Portfolio", "Staking", "Leaderboard"].map((item, idx) => (
						<button
							key={item}
							type="button"
							className={cn(
								"px-2.5 py-1.5 transition-colors",
								idx === 0 ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
							aria-label={item}
						>
							{item}
						</button>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
								tabIndex={0}
								aria-label="More options"
							>
								More <ChevronDown className="size-2.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-32 text-xs font-mono">
							<DropdownMenuItem>API</DropdownMenuItem>
							<DropdownMenuItem>Docs</DropdownMenuItem>
							<DropdownMenuItem>Support</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-[10px] uppercase tracking-wider border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green"
				>
					<Zap className="size-3 mr-1" />
					Deposit
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[10px] uppercase tracking-wider">
							<div className="size-1.5 rounded-full bg-terminal-green animate-pulse" />
							0x8f2...4a1b
							<ChevronDown className="size-2.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-44 text-xs font-mono">
						<DropdownMenuItem>Account</DropdownMenuItem>
						<DropdownMenuItem>Add funds</DropdownMenuItem>
						<DropdownMenuItem>Change network</DropdownMenuItem>
						<DropdownMenuItem className="text-terminal-red">Disconnect</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label="Notifications"
				>
					<Bell className="size-3.5" />
				</button>
				<ThemeToggle />
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label="Settings"
				>
					<Cog className="size-3.5" />
				</button>
			</div>
		</header>
	);
}

function ThemeToggle() {
	return (
		<ClientOnly>
			<ThemeToggleButton />
		</ClientOnly>
	);
}

function ThemeToggleButton() {
	const { theme, setTheme } = useTheme();

	const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	const handleToggle = () => {
		setTheme(isDark ? "light" : "dark");
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleToggle();
		}
	};

	return (
		<button
			type="button"
			className={cn(
				"size-7 flex items-center justify-center transition-colors",
				isDark
					? "text-terminal-amber hover:text-terminal-amber/80"
					: "text-terminal-purple hover:text-terminal-purple/80",
			)}
			onClick={handleToggle}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
		</button>
	);
}

function TickerStrip() {
	return (
		<div className="h-8 border-b border-border/60 bg-card/20">
			<ScrollArea className="w-full h-full">
				<div className="h-8 flex items-center gap-0.5 px-2 min-w-full">
					{markets.map((m) => (
						<MarketChip key={m.symbol} market={m} />
					))}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

function MarketChip({ market }: { market: Market }) {
	const isPositive = market.changePct >= 0;
	return (
		<button
			type="button"
			className={cn(
				"shrink-0 inline-flex items-center gap-2 px-2.5 py-1 text-[10px] transition-colors",
				"hover:bg-accent/50 border-r border-border/40",
			)}
			tabIndex={0}
			aria-label={`${market.symbol} ${isPositive ? "up" : "down"} ${Math.abs(market.changePct)}%`}
		>
			<span className="font-medium text-foreground">{market.base}</span>
			<span className="text-muted-foreground tabular-nums">${market.price.toLocaleString()}</span>
			<span className={cn("tabular-nums font-medium", isPositive ? "text-terminal-green" : "text-terminal-red")}>
				{isPositive ? "+" : ""}
				{market.changePct.toFixed(2)}%
			</span>
		</button>
	);
}

function MainWorkspace() {
	const { layout: mainLayout, onLayout: onMainLayout } = usePersistentLayout("terminal:layout:main", [82, 18]);

	return (
		<div className="flex-1 min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onMainLayout}>
				<ResizablePanel defaultSize={78}>
					<LeftSection />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={22}>
					<RightColumn />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

function LeftSection() {
	const { layout: vertLayout, onLayout: onVertLayout } = usePersistentLayout("terminal:layout:vert", [70, 30]);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="vertical" className="h-full min-h-0" onLayout={onVertLayout}>
				<ResizablePanel defaultSize={vertLayout[0] ?? 65} minSize={30}>
					<ChartOrderbookRow />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={vertLayout[1] ?? 35} minSize={20}>
					<PositionsPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

function ChartOrderbookRow() {
	const { layout: horizLayout, onLayout: onHorizLayout } = usePersistentLayout("terminal:layout:chart-book", [75, 25]);

	return (
		<div className="h-full min-h-0">
			<ResizablePanelGroup direction="horizontal" className="h-full min-h-0" onLayout={onHorizLayout}>
				<ResizablePanel defaultSize={horizLayout[0] ?? 70} minSize={40}>
					<ChartPanel />
				</ResizablePanel>
				<ResizableHandle
					withHandle
					className="bg-border/40 data-[resize-handle-state=hover]:bg-terminal-cyan/30 data-[resize-handle-state=drag]:bg-terminal-cyan/50"
				/>
				<ResizablePanel defaultSize={horizLayout[1] ?? 30} minSize={20}>
					<OrderBookPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

function ChartPanel() {
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

function StatBlock({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
	return (
		<div className="flex items-center gap-1.5">
			<span className="text-muted-foreground/70 uppercase">{label}</span>
			<span className={cn("tabular-nums font-medium", valueClass)}>{value}</span>
		</div>
	);
}

function ToolRailButton({ Icon }: { Icon: LucideIcon }) {
	return (
		<button
			type="button"
			className="size-7 flex items-center justify-center text-muted-foreground hover:text-terminal-cyan hover:bg-terminal-cyan/10 transition-colors"
			tabIndex={0}
			aria-label="chart tool"
		>
			<Icon className="size-3.5" />
		</button>
	);
}

function PositionsPanel() {
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
									"px-2 py-1 text-[10px] uppercase tracking-wider whitespace-nowrap transition-colors",
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
					<div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-2">
						<Circle className="size-1.5 fill-terminal-green text-terminal-green" />
						Active Positions
						<span className="text-terminal-cyan ml-auto tabular-nums">2</span>
					</div>
					<div className="flex-1 min-h-0 overflow-hidden border border-border/40 rounded-sm bg-background/50">
						<ScrollArea className="h-full w-full">
							<Table>
								<TableHeader>
									<TableRow className="border-border/40 hover:bg-transparent">
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 h-7">
											Asset
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Size
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Value
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Entry
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Mark
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											PNL
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Liq
										</TableHead>
										<TableHead className="text-[9px] uppercase tracking-wider text-muted-foreground/70 text-right h-7">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{positions.map((p) => {
										const isLong = p.size > 0;
										return (
											<TableRow key={`${p.coin}-${p.entryPrice}`} className="border-border/40 hover:bg-accent/30">
												<TableCell className="text-[11px] font-medium py-1.5">
													<div className="flex items-center gap-1.5">
														<span
															className={cn(
																"text-[9px] px-1 py-0.5 rounded-sm uppercase",
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
												<TableCell className="text-[11px] text-right tabular-nums py-1.5">
													{Math.abs(p.size).toFixed(2)}
												</TableCell>
												<TableCell className="text-[11px] text-right tabular-nums py-1.5">
													${p.positionValue.toFixed(2)}
												</TableCell>
												<TableCell className="text-[11px] text-right tabular-nums py-1.5">
													${p.entryPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-[11px] text-right tabular-nums text-terminal-amber py-1.5">
													${p.markPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-right py-1.5">
													<div
														className={cn(
															"text-[11px] tabular-nums",
															p.pnl >= 0 ? "text-terminal-green" : "text-terminal-red",
														)}
													>
														{p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
														<span className="text-muted-foreground ml-1">({p.roePct.toFixed(1)}%)</span>
													</div>
												</TableCell>
												<TableCell className="text-[11px] text-right tabular-nums text-terminal-red/70 py-1.5">
													${p.liqPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-right py-1.5">
													<div className="flex justify-end gap-1">
														<button
															type="button"
															className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-border/60 hover:border-terminal-red/60 hover:text-terminal-red transition-colors"
															tabIndex={0}
															aria-label="Close position"
														>
															Close
														</button>
														<button
															type="button"
															className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/60 hover:text-terminal-cyan transition-colors"
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

function OrderBookPanel() {
	const [tick, setTick] = useState("0.01");
	const [view, setView] = useState<"book" | "trades">("book");
	const maxTotal = Math.max(...[...asks, ...bids].map((r) => r.total));

	return (
		<div className="h-full min-h-0 flex flex-col overflow-hidden border-l border-border/40">
			<div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 bg-card/30">
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						onClick={() => setView("book")}
						className={cn(
							"px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
							view === "book" ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
						)}
						tabIndex={0}
						aria-label="Order Book"
					>
						Book
					</button>
					<button
						type="button"
						onClick={() => setView("trades")}
						className={cn(
							"px-2 py-1 text-[10px] uppercase tracking-wider transition-colors",
							view === "trades" ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
						)}
						tabIndex={0}
						aria-label="Recent Trades"
					>
						Trades
					</button>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-1.5 py-0.5 text-[9px] border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select tick size"
						>
							{tick}
							<ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-20 font-mono text-xs">
						{["0.01", "0.05", "0.1"].map((t) => (
							<DropdownMenuItem key={t} onClick={() => setTick(t)}>
								{t}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{view === "book" ? (
				<div className="flex-1 min-h-0 flex flex-col">
					<div className="grid grid-cols-3 gap-2 px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 shrink-0">
						<div>Price</div>
						<div className="text-right">Size</div>
						<div className="text-right">Total</div>
					</div>

					<div className="flex-1 min-h-0 flex flex-col">
						<ScrollArea className="flex-1 min-h-0">
							<div className="px-2 py-1 flex flex-col justify-end min-h-full">
								<div className="space-y-px">
									{asks
										.slice(0, 12)
										.reverse()
										.map((r) => (
											<BookRow key={`ask-${r.price}`} row={r} type="ask" maxTotal={maxTotal} />
										))}
								</div>
							</div>
						</ScrollArea>

						<div className="shrink-0 py-1.5 px-2 flex items-center justify-center gap-2 border-y border-border/40 bg-card/30">
							<span className="text-sm font-semibold tabular-nums text-terminal-amber terminal-glow-amber">102.45</span>
							<TrendingUp className="size-3 text-terminal-green" />
							<span className="text-[9px] text-muted-foreground">≈ $102.45</span>
						</div>

						<ScrollArea className="flex-1 min-h-0">
							<div className="px-2 py-1">
								<div className="space-y-px">
									{bids.slice(0, 12).map((r) => (
										<BookRow key={`bid-${r.price}`} row={r} type="bid" maxTotal={maxTotal} />
									))}
								</div>
							</div>
						</ScrollArea>
					</div>

					<div className="shrink-0 px-2 py-1.5 border-t border-border/40 flex items-center justify-between text-[9px] text-muted-foreground">
						<span>Spread</span>
						<span className="tabular-nums text-terminal-amber">0.05 (0.05%)</span>
					</div>
				</div>
			) : (
				<TradesView />
			)}
		</div>
	);
}

function BookRow({ row, type, maxTotal }: { row: OrderBookRow; type: "ask" | "bid"; maxTotal: number }) {
	const depthPct = (row.total / maxTotal) * 100;
	const isAsk = type === "ask";

	return (
		<div className="grid grid-cols-3 gap-2 text-[11px] tabular-nums py-0.5 relative hover:bg-accent/30 cursor-pointer group">
			<div
				className={cn("absolute inset-0 pointer-events-none", isAsk ? "depth-bar-ask" : "depth-bar-bid")}
				style={{ width: `${depthPct}%`, [isAsk ? "right" : "left"]: 0, [isAsk ? "left" : "right"]: "auto" }}
			/>
			<div className={cn("relative z-10", isAsk ? "text-terminal-red" : "text-terminal-green")}>
				{row.price.toFixed(2)}
			</div>
			<div className="text-right relative z-10 text-muted-foreground group-hover:text-foreground">
				{row.size.toFixed(3)}
			</div>
			<div className="text-right relative z-10 text-muted-foreground/70 group-hover:text-muted-foreground">
				{row.total.toFixed(3)}
			</div>
		</div>
	);
}

function TradesView() {
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
			<div className="grid grid-cols-3 gap-2 px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground/70 border-b border-border/40">
				<div>Time</div>
				<div className="text-right">Price</div>
				<div className="text-right">Size</div>
			</div>
			<ScrollArea className="flex-1">
				<div className="px-2 py-1 space-y-px">
					{trades.map((t) => (
						<div key={t.id} className="grid grid-cols-3 gap-2 text-[11px] tabular-nums py-0.5 hover:bg-accent/30">
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

function RightColumn() {
	return (
		<div className="h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 overflow-hidden">
				<OrderEntryPanel />
			</div>
			<AccountPanel />
		</div>
	);
}

function OrderEntryPanel() {
	const [mode, setMode] = useState("cross");
	const [type, setType] = useState("market");
	const [side, setSide] = useState<"buy" | "sell">("buy");
	const reduceOnlyId = useId();
	const tpSlId = useId();

	return (
		<div className="h-full flex flex-col overflow-hidden bg-card/20">
			<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
				<div className="flex items-center gap-1">
					{["Cross", "Isolated"].map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setMode(m.toLowerCase())}
							className={cn(
								"px-2 py-0.5 text-[10px] uppercase tracking-wider transition-colors",
								mode === m.toLowerCase()
									? "text-terminal-cyan bg-terminal-cyan/10"
									: "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
							aria-label={`${m} margin`}
						>
							{m}
						</button>
					))}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="px-2 py-0.5 text-[10px] border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select leverage"
						>
							10x <ChevronDown className="size-2.5" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-20 font-mono text-xs">
						{["5x", "10x", "20x", "50x", "100x"].map((lv) => (
							<DropdownMenuItem key={lv}>{lv}</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className="p-2 space-y-2 overflow-y-auto flex-1">
				<div className="flex items-center gap-0.5 p-0.5 bg-muted/30 rounded-sm">
					{["Market", "Limit", "Stop"].map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setType(t.toLowerCase())}
							className={cn(
								"flex-1 py-1 text-[10px] uppercase tracking-wider transition-colors rounded-sm",
								type === t.toLowerCase()
									? "bg-background text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
							aria-label={`${t} order`}
						>
							{t}
						</button>
					))}
				</div>

				<div className="grid grid-cols-2 gap-1">
					<button
						type="button"
						onClick={() => setSide("buy")}
						className={cn(
							"py-2 text-[11px] font-semibold uppercase tracking-wider transition-all border",
							side === "buy"
								? "bg-terminal-green/20 border-terminal-green text-terminal-green terminal-glow-green"
								: "border-border/60 text-muted-foreground hover:border-terminal-green/40 hover:text-terminal-green",
						)}
						tabIndex={0}
						aria-label="Buy Long"
					>
						<TrendingUp className="size-3 inline mr-1" />
						Long
					</button>
					<button
						type="button"
						onClick={() => setSide("sell")}
						className={cn(
							"py-2 text-[11px] font-semibold uppercase tracking-wider transition-all border",
							side === "sell"
								? "bg-terminal-red/20 border-terminal-red text-terminal-red terminal-glow-red"
								: "border-border/60 text-muted-foreground hover:border-terminal-red/40 hover:text-terminal-red",
						)}
						tabIndex={0}
						aria-label="Sell Short"
					>
						<TrendingDown className="size-3 inline mr-1" />
						Short
					</button>
				</div>

				<div className="space-y-0.5 text-[10px]">
					<div className="flex items-center justify-between text-muted-foreground">
						<span>Available</span>
						<span className="tabular-nums text-terminal-green">$1,245.12</span>
					</div>
					<div className="flex items-center justify-between text-muted-foreground">
						<span>Position</span>
						<span className="tabular-nums">0.00 AAVE</span>
					</div>
				</div>

				<div className="space-y-1.5">
					<div className="text-[9px] uppercase tracking-wider text-muted-foreground">Size</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							className="px-2 py-1.5 text-[10px] border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
							tabIndex={0}
							aria-label="Select asset"
						>
							AAVE <ChevronDown className="size-2.5" />
						</button>
						<Input
							placeholder="0.00"
							className="flex-1 h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
						/>
					</div>
					<div className="grid grid-cols-4 gap-1">
						{["25%", "50%", "75%", "Max"].map((p) => (
							<button
								key={p}
								type="button"
								className="py-1 text-[9px] uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/40 hover:text-terminal-cyan transition-colors"
								tabIndex={0}
								aria-label={`Set ${p}`}
							>
								{p}
							</button>
						))}
					</div>
				</div>

				{type === "limit" && (
					<div className="space-y-1.5">
						<div className="text-[9px] uppercase tracking-wider text-muted-foreground">Limit Price</div>
						<Input
							placeholder="0.00"
							className="h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
						/>
					</div>
				)}

				<div className="flex items-center gap-3 text-[10px]">
					<div className="inline-flex items-center gap-1.5 cursor-pointer">
						<Checkbox id={reduceOnlyId} className="size-3.5" aria-label="Reduce Only" />
						<label htmlFor={reduceOnlyId} className="text-muted-foreground cursor-pointer">
							Reduce Only
						</label>
					</div>
					<div className="inline-flex items-center gap-1.5 cursor-pointer">
						<Checkbox id={tpSlId} className="size-3.5" aria-label="Take Profit / Stop Loss" />
						<label htmlFor={tpSlId} className="text-muted-foreground cursor-pointer">
							TP/SL
						</label>
					</div>
				</div>
				<div className="h-10" />

				<button
					type="button"
					className={cn(
						"w-full py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border",
						side === "buy"
							? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
							: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
					)}
					tabIndex={0}
					aria-label="Place order"
				>
					{side === "buy" ? "Buy / Long" : "Sell / Short"} AAVE
				</button>

				<div className="border border-border/40 divide-y divide-border/40 text-[10px]">
					{[
						["Liq. Price", "$72.12", "text-terminal-red/70"],
						["Order Value", "$1,245.30", ""],
						["Margin Req.", "$212.40", ""],
						["Slippage", "0.05%", "text-terminal-amber"],
						["Fees", "$0.80", "text-muted-foreground"],
					].map(([k, v, cls]) => (
						<div key={k} className="flex items-center justify-between px-2 py-1.5">
							<span className="text-muted-foreground">{k}</span>
							<span className={cn("tabular-nums", cls)}>{v}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function AccountPanel() {
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<"perps" | "spot">("perps");

	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={setIsExpanded}
			className="shrink-0 flex flex-col bg-card/30 border-t border-border/40"
		>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="w-full px-2 py-2 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer group border-b border-border/40"
					tabIndex={0}
					aria-label={isExpanded ? "Collapse account panel" : "Expand account panel"}
				>
					<div className="flex items-center gap-2">
						<span className="text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
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
							<span className="text-[9px] text-muted-foreground uppercase">Equity</span>
							<span className="text-sm font-semibold tabular-nums text-terminal-green terminal-glow-green">
								$12,450.23
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							<span className="text-[9px] text-muted-foreground uppercase">PNL</span>
							<span className="text-[11px] font-medium tabular-nums text-terminal-green">+$241.12</span>
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
								"px-2 py-1 text-[9px] uppercase tracking-wider transition-colors",
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
					<div className="border border-border/40 divide-y divide-border/40 text-[10px]">
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
							className="py-1.5 text-[10px] uppercase tracking-wider border border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 transition-colors"
							tabIndex={0}
							aria-label="Deposit"
						>
							Deposit
						</button>
						<button
							type="button"
							className="py-1.5 text-[10px] uppercase tracking-wider border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
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

function FooterBar() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const interval = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<footer className="h-6 border-t border-border/60 px-2 text-[9px] uppercase tracking-wider flex items-center justify-between bg-card/40">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					<Wifi className="size-3 text-terminal-green" />
					<span className="text-terminal-green">Connected</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>Block:</span>
					<span className="tabular-nums text-terminal-cyan">18,942,103</span>
				</div>
				<div className="h-3 w-px bg-border/60" />
				<div className="flex items-center gap-1.5 text-muted-foreground">
					<span>Gas:</span>
					<span className="tabular-nums text-terminal-amber">24 gwei</span>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-muted-foreground">
					Latency: <span className="tabular-nums text-terminal-green">12ms</span>
				</span>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground tabular-nums">{time.toLocaleTimeString()}</span>
				<div className="h-3 w-px bg-border/60" />
				<span className="text-muted-foreground">v0.1.0</span>
			</div>
		</footer>
	);
}
