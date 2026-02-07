import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { BellIcon, CaretDownIcon, DownloadSimpleIcon, GearIcon, TerminalIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
import { useDepositModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const NAV_ITEMS = [
	{ key: "trade", label: <Trans>Trade</Trans>, active: true },
	{ key: "vaults", label: <Trans>Vaults</Trans>, active: false },
	{ key: "portfolio", label: <Trans>Portfolio</Trans>, active: false },
	{ key: "staking", label: <Trans>Staking</Trans>, active: false },
	{ key: "leaderboard", label: <Trans>Leaderboard</Trans>, active: false },
] as const;

const MORE_ITEMS = [
	{ key: "api", label: <Trans>API</Trans> },
	{ key: "docs", label: <Trans>Docs</Trans> },
	{ key: "support", label: <Trans>Support</Trans> },
] as const;

export function TopNav() {
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { isConnected } = useConnection();

	return (
		<header className="fixed top-0 left-0 right-0 z-40 h-11 border-b border-border/20 px-3 flex items-center justify-between bg-surface-800">
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-action-primary/10 border border-action-primary/30 flex items-center justify-center">
						<TerminalIcon className="size-3 text-action-primary" />
					</div>
					<span className="text-xs font-bold tracking-tight">
						<span className="text-action-primary">HYPE</span>
						<span className="text-fg-900">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border/60 hidden md:block" />
				<nav className="hidden lg:flex items-center text-nav tracking-wide">
					{NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							className={cn(
								"px-2.5 py-1.5 transition-colors",
								item.active ? "text-action-primary font-medium" : "text-fg-900 hover:text-action-primary",
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
								className="px-2.5 py-1.5 text-fg-900 hover:text-action-primary transition-colors inline-flex items-center gap-1 font-normal"
								aria-label={t`More options`}
							>
								<Trans>More</Trans>
								<CaretDownIcon className="size-2.5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="min-w-32 text-xs font-mono">
							{MORE_ITEMS.map((item) => (
								<DropdownMenuItem key={item.key}>{item.label}</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>
			</div>

			<div className="flex items-center gap-2">
				{isConnected && (
					<button
						type="button"
						onClick={() => openDepositModal("deposit")}
						className="h-7 px-3 text-xs font-medium rounded border border-border text-fg-900 hover:border-fg-400 transition-colors inline-flex items-center gap-1.5"
					>
						<DownloadSimpleIcon className="size-3.5" />
						<Trans>Deposit</Trans>
					</button>
				)}
				<UserMenu />
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="size-7 inline-flex items-center justify-center rounded text-fg-700 hover:text-action-primary transition-colors"
						aria-label={t`Notifications`}
					>
						<BellIcon className="size-3.5" />
					</button>
					<ThemeToggle />
					<button
						type="button"
						className="size-7 inline-flex items-center justify-center rounded text-fg-700 hover:text-action-primary transition-colors"
						onClick={openSettingsDialog}
						aria-label={t`Settings`}
					>
						<GearIcon className="size-3.5" />
					</button>
				</div>
			</div>
		</header>
	);
}
