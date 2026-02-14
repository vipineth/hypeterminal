import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, GearIcon, TerminalIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useDepositModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const SCOPE_NAV_ITEMS = [
	{ scope: "all" as const, label: <Trans>All</Trans>, to: "/", activeClass: "text-text-950 font-medium" },
	{ scope: "perp" as const, label: <Trans>Perp</Trans>, to: "/perp", activeClass: "text-scope-perp font-medium" },
	{ scope: "spot" as const, label: <Trans>Spot</Trans>, to: "/spot", activeClass: "text-scope-spot font-medium" },
	{
		scope: "builders-perp" as const,
		label: <Trans>Builders</Trans>,
		to: "/builders-perp",
		activeClass: "text-scope-builders font-medium",
	},
] as const;

const STATIC_NAV_ITEMS = [
	{ key: "vaults", label: <Trans>Vaults</Trans> },
	{ key: "portfolio", label: <Trans>Portfolio</Trans> },
	{ key: "staking", label: <Trans>Staking</Trans> },
	{ key: "leaderboard", label: <Trans>Leaderboard</Trans> },
] as const;

function getScopeAccentClass(scope: string): string {
	switch (scope) {
		case "perp":
			return "border-scope-perp/40";
		case "spot":
			return "border-scope-spot/40";
		case "builders-perp":
			return "border-scope-builders/40";
		default:
			return "border-border-100";
	}
}

export function TopNav() {
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { isConnected } = useConnection();
	const { scope } = useExchangeScope();

	const accentClass = getScopeAccentClass(scope);

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-40 h-10 md:h-11 border-b px-2 md:px-3 flex items-center justify-between bg-surface-execution transition-colors duration-300 ease-in-out",
				accentClass,
			)}
		>
			<div className="flex items-center gap-2 md:gap-3 min-w-0">
				<div className="flex items-center gap-1 md:gap-1.5">
					<div className="size-4 md:size-5 rounded bg-primary-default/10 border border-primary-default/30 flex items-center justify-center">
						<TerminalIcon className="size-2.5 md:size-3 text-primary-default" />
					</div>
					<span className="text-3xs md:text-xs font-bold tracking-tight">
						<span className="text-primary-default">HYPE</span>
						<span className="text-text-950">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-border-200 hidden md:block" />
				<nav className="hidden lg:flex items-center text-nav tracking-wide">
					{SCOPE_NAV_ITEMS.map((item) => (
						<Link
							key={item.scope}
							to={item.to}
							className={cn(
								"px-2.5 py-1.5 transition-colors duration-150",
								scope === item.scope ? item.activeClass : "text-text-950 hover:text-text-600",
							)}
						>
							{item.label}
						</Link>
					))}
					<div className="h-4 w-px bg-border-200 mx-1" />
					{STATIC_NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							disabled
							className="px-2.5 py-1.5 text-text-950/40 cursor-not-allowed"
							tabIndex={-1}
						>
							{item.label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-1.5 md:gap-2">
				{isConnected && (
					<Button
						variant="outlined"
						onClick={() => openDepositModal("deposit")}
						className="h-5 px-1.5 text-2xs md:h-6 md:px-2 md:text-xs font-medium rounded-xs bg-fill-100 border border-border-300 text-text-950 hover:border-border-500 transition-colors inline-flex items-center gap-1 shadow-xs"
					>
						<DownloadSimpleIcon className="size-3.5 md:size-4" />
						<Trans>Deposit</Trans>
					</Button>
				)}
				<UserMenu />
				<div className="flex items-center gap-0.5 md:gap-1">
					<ThemeToggle />
					<button
						type="button"
						className="size-6 md:size-7 inline-flex items-center justify-center rounded text-text-600 hover:text-primary-default transition-colors duration-150"
						onClick={openSettingsDialog}
						aria-label={t`Settings`}
					>
						<GearIcon className="size-3.5 md:size-4" />
					</button>
				</div>
			</div>
		</header>
	);
}
