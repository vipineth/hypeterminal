import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { BellIcon, DownloadSimpleIcon, GearIcon, TerminalIcon } from "@phosphor-icons/react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
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

export function TopNav() {
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { isConnected } = useConnection();

	return (
		<header className="fixed top-0 left-0 right-0 z-40 h-11 border-b border-border-100 px-3 flex items-center justify-between bg-surface-execution">
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded bg-primary-default/10 border border-primary-default/30 flex items-center justify-center">
						<TerminalIcon className="size-3 text-primary-default" />
					</div>
					<span className="text-xs font-bold tracking-tight">
						<span className="text-primary-default">HYPE</span>
						<span className="text-text-950">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border-200 hidden md:block" />
				<nav className="hidden lg:flex items-center text-nav tracking-wide">
					{NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							className={cn(
								"px-2.5 py-1.5 transition-colors",
								item.active ? "text-primary-default font-medium" : "text-text-950 hover:text-primary-default",
							)}
							tabIndex={0}
						>
							{item.label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-2">
				{isConnected && (
					<Button
						variant="outlined"
						onClick={() => openDepositModal("deposit")}
						className="h-6 px-2 text-xs font-medium rounded-xs bg-fill-100 border border-border-300 text-text-950 hover:border-border-500 transition-colors inline-flex items-center gap-1 shadow-xs"
					>
						<DownloadSimpleIcon className="size-4" />
						<Trans>Deposit</Trans>
					</Button>
				)}
				<UserMenu />
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="size-7 inline-flex items-center justify-center rounded text-text-600 hover:text-primary-default transition-colors"
						aria-label={t`Notifications`}
					>
						<BellIcon className="size-4" />
					</button>
					<ThemeToggle />
					<button
						type="button"
						className="size-7 inline-flex items-center justify-center rounded text-text-600 hover:text-primary-default transition-colors"
						onClick={openSettingsDialog}
						aria-label={t`Settings`}
					>
						<GearIcon className="size-4" />
					</button>
				</div>
			</div>
		</header>
	);
}
