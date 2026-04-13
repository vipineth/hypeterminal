import { Button, ButtonIcon, Divider } from "@hypeterminal/ui";
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
				"fixed left-0 right-0 z-40 h-11 border-b border-stroke-weak px-3 flex items-center justify-between bg-bg-base transition-colors duration-300 ease-in-out",
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
				<Divider orientation="vertical" className="my-2 hidden lg:block" />
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
					<Divider orientation="vertical" className="my-2 mx-1" />
					<Link
						to="/account"
						className="px-2.5 py-1 rounded-8 transition-colors duration-150 text-text-weak hover:text-text-strong [&.active]:text-text-strong [&.active]:font-medium"
					>
						<Trans>Account</Trans>
					</Link>
					{STATIC_NAV_ITEMS.map((item) => (
						<button
							key={item.key}
							type="button"
							disabled
							className="px-2.5 py-1.5 text-text-disabled cursor-not-allowed"
							tabIndex={-1}
						>
							{item.label}
						</button>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-2 min-h-8">
				{isConnected && (
					<Button
						variant="filled"
						intent="brand"
						size="sm"
						onClick={() => openDepositModal("deposit")}
						iconLeft={<DownloadSimpleIcon className="size-3.5" />}
						className="h-8 min-h-8 shrink-0 px-3"
					>
						<Trans>Deposit</Trans>
					</Button>
				)}
				<UserMenu />
				<ThemeToggle />
				<ButtonIcon
					variant="ghost"
					intent="neutral"
					className="size-8 shrink-0"
					onClick={openSettingsDialog}
					aria-label={t`Settings`}
				>
					<GearIcon className="size-4" />
				</ButtonIcon>
			</div>
		</header>
	);
}
