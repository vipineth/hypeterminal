import { Bell, ChevronDown, Cog, Terminal, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UI_TEXT } from "@/constants/app";
import { cn } from "@/lib/utils";
import { DepositModal } from "../order-entry/deposit-modal";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const TOP_NAV_TEXT = UI_TEXT.TOP_NAV;

export function TopNav() {
	const [depositModalOpen, setDepositModalOpen] = useState(false);

	return (
		<header className="h-11 border-b border-border/60 px-2 flex items-center justify-between bg-surface/40">
			<div className="flex items-center gap-2 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-terminal-green/20 border border-terminal-green/40 flex items-center justify-center">
						<Terminal className="size-3 text-terminal-green" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-terminal-cyan">
						{TOP_NAV_TEXT.BRAND_PREFIX}
						<span className="text-foreground">{TOP_NAV_TEXT.BRAND_SUFFIX}</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
				<nav className="hidden lg:flex items-center text-3xs uppercase tracking-wider">
					{TOP_NAV_TEXT.NAV_ITEMS.map((item, idx) => (
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
								aria-label={TOP_NAV_TEXT.MORE_ARIA}
							>
								{TOP_NAV_TEXT.MORE_LABEL} <ChevronDown className="size-2.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-32 text-xs font-mono">
							{TOP_NAV_TEXT.MORE_MENU_ITEMS.map((item) => (
								<DropdownMenuItem key={item}>{item}</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>
			</div>

			<div className="flex items-center gap-1.5">
				<Button
					size="sm"
					variant="outline"
					className="h-7 text-3xs uppercase tracking-wider border-terminal-green/40 text-terminal-green hover:bg-terminal-green/10 hover:text-terminal-green"
					onClick={() => setDepositModalOpen(true)}
				>
					<Zap className="size-3 mr-1" />
					{TOP_NAV_TEXT.DEPOSIT_LABEL}
				</Button>
				<UserMenu />
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label={TOP_NAV_TEXT.NOTIFICATIONS_ARIA}
				>
					<Bell className="size-3.5" />
				</button>
				<ThemeToggle />
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label={TOP_NAV_TEXT.SETTINGS_ARIA}
				>
					<Cog className="size-3.5" />
				</button>
			</div>
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
		</header>
	);
}
