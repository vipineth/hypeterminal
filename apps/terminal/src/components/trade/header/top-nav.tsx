import { Button, ButtonIcon } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { DownloadSimpleIcon, GearIcon, TerminalIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useConnection } from "wagmi";
import { cn } from "@/lib/cn";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useDepositModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { useIsTestnet } from "@/stores/use-global-settings-store";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const SCOPE_NAV_ITEMS = [
	{
		scope: "all" as const,
		label: <Trans>All</Trans>,
		to: "/",
		activeClass: "text-text-strong font-medium bg-fill-hover",
	},
	{
		scope: "perp" as const,
		label: <Trans>Perp</Trans>,
		to: "/perp",
		activeClass: "text-scope-perp font-medium bg-scope-perp/10",
	},
	{
		scope: "spot" as const,
		label: <Trans>Spot</Trans>,
		to: "/spot",
		activeClass: "text-scope-spot font-medium bg-scope-spot/10",
	},
	{
		scope: "builders-perp" as const,
		label: <Trans>Builders</Trans>,
		to: "/builders-perp",
		activeClass: "text-scope-builders font-medium bg-scope-builders/10",
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
			return "border-stroke-weak";
	}
}

export function TopNav() {
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();
	const { isConnected } = useConnection();
	const { scope } = useExchangeScope();
	const isTestnet = useIsTestnet();

	const accentClass = getScopeAccentClass(scope);

	return (
		<header
			className={cn(
				"fixed left-0 right-0 z-40 h-11 border-b px-3 flex items-center justify-between bg-bg-overlay transition-colors duration-300 ease-in-out",
				isTestnet ? "top-8" : "top-0",
				accentClass,
			)}
		>
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex items-center gap-1.5">
					<div className="size-5 rounded-8 bg-fill-brand-strong/10 border border-fill-brand-strong/30 flex items-center justify-center">
						<TerminalIcon className="size-3 text-text-brand" />
					</div>
					<span className="text-xs font-bold tracking-tight">
						<span className="text-text-brand">HYPE</span>
						<span className="text-text-strong">TERMINAL</span>
					</span>
				</div>
				<div className="h-4 w-px bg-stroke-weak hidden md:block" />
				<nav className="hidden lg:flex items-center text-xs tracking-wide">
					{SCOPE_NAV_ITEMS.map((item) => (
						<Link
							key={item.scope}
							to={item.to}
							className={cn(
								"px-2.5 py-1 rounded-8 transition-colors duration-150",
								scope === item.scope ? item.activeClass : "text-text-weak hover:text-text-strong",
							)}
						>
							{item.label}
						</Link>
					))}
					<div className="h-4 w-px bg-stroke-weak mx-1" />
					{STATIC_NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							disabled
							className="px-2.5 py-1.5 text-text-strong/40 cursor-not-allowed"
							tabIndex={-1}
						>
							{item.label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-2">
				{isConnected && (
					<Button
						variant="outline"
						intent="neutral"
						onClick={() => openDepositModal("deposit")}
						iconLeft={<DownloadSimpleIcon className="size-4" />}
						className="h-6 px-2 text-xs font-medium"
					>
						<Trans>Deposit</Trans>
					</Button>
				)}
				<UserMenu />
				<div className="flex items-center gap-1">
					<ThemeToggle />
					<ButtonIcon
						variant="ghost"
						intent="neutral"
						className="size-7"
						onClick={openSettingsDialog}
						aria-label={t`Settings`}
					>
						<GearIcon className="size-4" />
					</ButtonIcon>
				</div>
			</div>
		</header>
	);
}
