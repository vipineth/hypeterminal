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
				"fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b bg-surface-base/88 px-4 backdrop-blur-xl transition-colors duration-300 ease-in-out",
				accentClass,
			)}
		>
			<div className="flex min-w-0 items-center gap-4">
				<div className="flex items-center gap-2">
					<div className="flex size-6 items-center justify-center rounded-lg border border-primary-default/20 bg-primary-default/10">
						<TerminalIcon className="size-3.5 text-primary-default" />
					</div>
					<span className="text-sm font-semibold tracking-tight">
						<span className="text-primary-default">HYPE</span>
						<span className="text-text-950">TERMINAL</span>
					</span>
				</div>
				<div className="hidden h-5 w-px bg-border-100 md:block" />
				<nav className="hidden items-center text-sm lg:flex">
					{SCOPE_NAV_ITEMS.map((item) => (
						<Link
							key={item.scope}
							to={item.to}
							className={cn(
								"rounded-md px-2.5 py-1.5 transition-colors duration-150",
								scope === item.scope ? item.activeClass : "text-text-500 hover:bg-accent hover:text-text-950",
							)}
						>
							{item.label}
						</Link>
					))}
					<div className="mx-2 h-5 w-px bg-border-100" />
					{STATIC_NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							disabled
							className="rounded-md px-2.5 py-1.5 text-text-400 cursor-not-allowed"
							tabIndex={-1}
						>
							{item.label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-2.5">
				{isConnected && (
					<Button
						variant="outline"
						onClick={() => openDepositModal("deposit")}
						className="h-8 gap-1.5 rounded-lg border-border-100 bg-surface-execution px-3 text-sm font-medium text-text-950 shadow-xs hover:bg-accent"
					>
						<DownloadSimpleIcon className="size-4" />
						<Trans>Deposit</Trans>
					</Button>
				)}
				<UserMenu />
				<div className="flex items-center gap-1">
					<ThemeToggle />
					<button
						type="button"
						className="inline-flex size-8 items-center justify-center rounded-lg text-text-500 transition-colors duration-150 hover:bg-accent hover:text-text-950"
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
