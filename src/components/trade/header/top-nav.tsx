import { Bell, ChevronDown, Cog, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function TopNav() {
	return (
		<header className="h-11 border-b border-border/60 px-2 flex items-center justify-between bg-surface/40">
			<div className="flex items-center gap-2 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-terminal-green/20 border border-terminal-green/40 flex items-center justify-center">
						<Terminal className="size-3 text-terminal-green" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-terminal-cyan">
						HYPE<span className="text-foreground">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
				<nav className="hidden lg:flex items-center text-3xs uppercase tracking-wider">
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
					className="h-7 text-3xs uppercase tracking-wider border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green"
				>
					<Zap className="size-3 mr-1" />
					Deposit
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-7 gap-1.5 text-3xs uppercase tracking-wider">
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
