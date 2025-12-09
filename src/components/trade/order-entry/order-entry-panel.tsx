import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function OrderEntryPanel() {
	const [mode, setMode] = useState("cross");
	const [type, setType] = useState("market");
	const [side, setSide] = useState<"buy" | "sell">("buy");
	const reduceOnlyId = useId();
	const tpSlId = useId();

	return (
		<div className="h-full flex flex-col overflow-hidden bg-surface/20">
			<div className="px-2 py-1.5 border-b border-border/40 flex items-center justify-between">
				<div className="flex items-center gap-1">
					{["Cross", "Isolated"].map((m) => (
						<button
							key={m}
							type="button"
							onClick={() => setMode(m.toLowerCase())}
							className={cn(
								"px-2 py-0.5 text-3xs uppercase tracking-wider transition-colors",
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
							className="px-2 py-0.5 text-3xs border border-terminal-cyan/40 text-terminal-cyan inline-flex items-center gap-1"
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
								"flex-1 py-1 text-3xs uppercase tracking-wider transition-colors rounded-sm",
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
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
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
							"py-2 text-2xs font-semibold uppercase tracking-wider transition-all border",
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

				<div className="space-y-0.5 text-3xs">
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
					<div className="text-4xs uppercase tracking-wider text-muted-foreground">Size</div>
					<div className="flex items-center gap-1">
						<button
							type="button"
							className="px-2 py-1.5 text-3xs border border-border/60 hover:border-foreground/30 inline-flex items-center gap-1"
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
								className="py-1 text-4xs uppercase tracking-wider border border-border/60 hover:border-terminal-cyan/40 hover:text-terminal-cyan transition-colors"
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
						<div className="text-4xs uppercase tracking-wider text-muted-foreground">Limit Price</div>
						<Input
							placeholder="0.00"
							className="h-8 text-sm bg-background/50 border-border/60 focus:border-terminal-cyan/60 tabular-nums"
						/>
					</div>
				)}

				<div className="flex items-center gap-3 text-3xs">
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
						"w-full py-2.5 text-2xs font-semibold uppercase tracking-wider transition-all border",
						side === "buy"
							? "bg-terminal-green/20 border-terminal-green text-terminal-green hover:bg-terminal-green/30"
							: "bg-terminal-red/20 border-terminal-red text-terminal-red hover:bg-terminal-red/30",
					)}
					tabIndex={0}
					aria-label="Place order"
				>
					{side === "buy" ? "Buy / Long" : "Sell / Short"} AAVE
				</button>

				<div className="border border-border/40 divide-y divide-border/40 text-3xs">
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
