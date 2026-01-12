import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Bell, ChevronDown, Cog, Terminal, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { GlobalSettingsDialog } from "../components/global-settings-dialog";
import { DepositModal } from "../order-entry/deposit-modal";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
	{ key: "trade", label: <Trans>Trade</Trans> },
	{ key: "vaults", label: <Trans>Vaults</Trans> },
	{ key: "portfolio", label: <Trans>Portfolio</Trans> },
	{ key: "staking", label: <Trans>Staking</Trans> },
	{ key: "leaderboard", label: <Trans>Leaderboard</Trans> },
] as const;

const MORE_MENU_ITEMS = [
	{ key: "api", label: <Trans>API</Trans> },
	{ key: "docs", label: <Trans>Docs</Trans> },
	{ key: "support", label: <Trans>Support</Trans> },
] as const;

export function TopNav() {
	const [depositModalOpen, setDepositModalOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-40 h-11 border-b border-border/60 px-2 flex items-center justify-between bg-surface">
			<div className="flex items-center gap-2 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-terminal-green/20 border border-terminal-green/40 flex items-center justify-center">
						<Terminal className="size-3 text-terminal-green" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-terminal-cyan">
						HYPE
						<span className="text-foreground">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border/60 mx-1 hidden md:block" />
				<nav className="hidden lg:flex items-center text-3xs uppercase tracking-wider">
					{NAV_ITEMS.map((item, idx) => (
						<Button
							key={item.key}
							variant="ghost"
							size="none"
							className={cn(
								"px-2.5 py-1.5 transition-colors hover:bg-transparent",
								idx === 0 ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
						>
							{item.label}
						</Button>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="none"
								className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-transparent inline-flex items-center gap-1"
								tabIndex={0}
								aria-label={t`More options`}
							>
								<Trans>More</Trans> <ChevronDown className="size-2.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-32 text-xs font-mono">
							{MORE_MENU_ITEMS.map((item) => (
								<DropdownMenuItem key={item.key}>{item.label}</DropdownMenuItem>
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
					<Trans>Deposit</Trans>
				</Button>
				<UserMenu />
				<Button variant="ghost" size="icon-sm" className="size-7" aria-label={t`Notifications`}>
					<Bell className="size-3.5" />
				</Button>
				<ThemeToggle />
				<Button
					variant="ghost"
					size="icon-sm"
					className="size-7"
					aria-label={t`Settings`}
					onClick={() => setSettingsOpen(true)}
				>
					<Cog className="size-3.5" />
				</Button>
			</div>
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
			<GlobalSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</header>
	);
}
