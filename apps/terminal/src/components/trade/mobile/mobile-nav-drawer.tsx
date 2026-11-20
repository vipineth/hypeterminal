import { Badge, Button, ButtonIcon, Divider, Drawer, DrawerContent } from "@hypeterminal/ui";
import { Trans } from "@lingui/react/macro";
import {
	DownloadSimpleIcon,
	GearIcon,
	HammerIcon,
	ListIcon,
	TerminalIcon,
	TrendUpIcon,
	WalletIcon,
	XIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useConnection } from "wagmi";
import { SCOPE_NAV_ITEMS, STATIC_NAV_ITEMS } from "@/config/nav";
import { cn } from "@/lib/cn";
import { useExchangeScope } from "@/providers/exchange-scope";
import { useDepositModalActions, useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { WalletModal } from "../components/wallet-modal";
import { ThemeToggle } from "../header/theme-toggle";

function ScopeIcon({ scope }: { scope: string }) {
	switch (scope) {
		case "perp":
			return <TrendUpIcon className="size-4 shrink-0" />;
		case "spot":
			return <WalletIcon className="size-4 shrink-0" />;
		case "builders-perp":
			return <HammerIcon className="size-4 shrink-0" />;
		default:
			return <TerminalIcon className="size-4 shrink-0" />;
	}
}

export function MobileNavDrawer() {
	const [open, setOpen] = useState(false);
	const [walletOpen, setWalletOpen] = useState(false);
	const { scope } = useExchangeScope();
	const { isConnected } = useConnection();
	const { open: openDepositModal } = useDepositModalActions();
	const { open: openSettingsDialog } = useSettingsDialogActions();

	function close() {
		setOpen(false);
	}

	return (
		<>
			<ButtonIcon
				variant="ghost"
				intent="neutral"
				size="md"
				className="touch-target"
				aria-label="Open navigation"
				onClick={() => setOpen(true)}
			>
				<ListIcon className="size-4" />
			</ButtonIcon>

			<Drawer side="left" open={open} onOpenChange={setOpen}>
				<DrawerContent className="w-[80vw] max-w-72 flex flex-col p-0">
					<div className="h-12 px-3 flex items-center justify-between border-b border-stroke-weak/60 shrink-0">
						<div className="flex items-center gap-1.5">
							<div className="size-5 rounded-8 bg-brand/10 border border-stroke-brand-strong/30 flex items-center justify-center">
								<TerminalIcon className="size-3 text-brand" />
							</div>
							<span className="text-xs font-bold tracking-tight">
								<span className="text-brand">HYPE</span>
								<span className="text-fg">TERMINAL</span>
							</span>
						</div>
						<ButtonIcon variant="ghost" intent="neutral" size="md" aria-label="Close navigation" onClick={close}>
							<XIcon className="size-4" />
						</ButtonIcon>
					</div>

					<div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
						<nav className="p-2 flex flex-col" aria-label="Markets">
							<p className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
								<Trans>Markets</Trans>
							</p>
							{SCOPE_NAV_ITEMS.map((item) => (
								<Link
									key={item.scope}
									to={item.to}
									onClick={close}
									className={cn(
										"flex items-center gap-3 px-3 py-2.5 rounded-xs text-sm transition-colors duration-150",
										scope === item.scope ? item.activeClass : "text-fg-muted hover:text-fg hover:bg-fill-hover",
									)}
								>
									<ScopeIcon scope={item.scope} />
									{item.label}
								</Link>
							))}
						</nav>

						<Divider className="mx-3" />

						<nav className="p-2 flex flex-col" aria-label="Platform">
							<p className="px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
								<Trans>Platform</Trans>
							</p>
							{STATIC_NAV_ITEMS.map((item) => (
								<div
									key={item.key}
									className="flex items-center justify-between px-3 py-2.5 rounded-xs text-sm text-fg-disabled"
								>
									<span>{item.label}</span>
									<Badge tone="neutral" size="xxs" className="text-fg-disabled">
										<Trans>Soon</Trans>
									</Badge>
								</div>
							))}
						</nav>
					</div>

					<div className="shrink-0 p-3 border-t border-stroke-weak/60 flex flex-col gap-2">
						{isConnected ? (
							<Button
								variant="filled"
								intent="brand"
								size="sm"
								onClick={() => {
									openDepositModal("deposit");
									close();
								}}
								iconLeft={<DownloadSimpleIcon className="size-3.5" />}
								className="w-full"
							>
								<Trans>Deposit</Trans>
							</Button>
						) : (
							<Button
								variant="outline"
								intent="neutral"
								size="sm"
								onClick={() => {
									setWalletOpen(true);
									close();
								}}
								iconLeft={<WalletIcon className="size-3.5" />}
								className="w-full"
							>
								<Trans>Connect Wallet</Trans>
							</Button>
						)}
						<div className="flex items-center justify-between pt-1">
							<ButtonIcon
								variant="ghost"
								intent="neutral"
								size="md"
								aria-label="Settings"
								onClick={() => {
									openSettingsDialog();
									close();
								}}
							>
								<GearIcon className="size-4" />
							</ButtonIcon>
							<ThemeToggle />
						</div>
					</div>
				</DrawerContent>
			</Drawer>

			<WalletModal open={walletOpen} onOpenChange={setWalletOpen} />
		</>
	);
}
