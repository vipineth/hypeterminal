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
import { cn } from "@/lib/utils";
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
		<header className="h-11 border-b border-border/60 px-2 flex items-center justify-between bg-surface/40">
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
						<button
							key={item.key}
							type="button"
							className={cn(
								"px-2.5 py-1.5 transition-colors",
								idx === 0 ? "text-terminal-cyan" : "text-muted-foreground hover:text-foreground",
							)}
							tabIndex={0}
						>
							{item.label}
						</button>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								type="button"
								className="px-2.5 py-1.5 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
								tabIndex={0}
								aria-label={t`More options`}
							>
								<Trans>More</Trans> <ChevronDown className="size-2.5" />
							</button>
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
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label={t`Notifications`}
				>
					<Bell className="size-3.5" />
				</button>
				<ThemeToggle />
				<button
					type="button"
					className="size-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
					tabIndex={0}
					aria-label={t`Settings`}
					onClick={() => setSettingsOpen(true)}
				>
					<Cog className="size-3.5" />
				</button>
			</div>
			<DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} />
			<GlobalSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</header>
	);
}
