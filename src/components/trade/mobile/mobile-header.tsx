import { BellIcon, GearIcon, TerminalIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/config/constants";
import { cn } from "@/lib/cn";
import { useSettingsDialogActions } from "@/stores/use-global-modal-store";
import { ThemeToggle } from "../header/theme-toggle";
import { UserMenu } from "../header/user-menu";

const TOP_NAV_TEXT = UI_TEXT.TOP_NAV;

interface Props {
	className?: string;
}

export function MobileHeader({ className }: Props) {
	const { open: openSettingsDialog } = useSettingsDialogActions();

	return (
		<header
			className={cn(
				"pt-[env(safe-area-inset-top)]",
				"sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm",
				"border-b border-border-200/60",
				className,
			)}
		>
			<div className="h-12 px-3 flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<div className="size-6 rounded bg-market-up-100 border border-market-up-600/40 flex items-center justify-center">
						<TerminalIcon className="size-3.5 text-market-up-600" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-primary-default">
						{TOP_NAV_TEXT.BRAND_PREFIX}
						<span className="text-text-950">{TOP_NAV_TEXT.BRAND_SUFFIX}</span>
					</span>
				</div>

				<div className="flex items-center gap-1">
					<UserMenu />
					<Button
						variant="text"
						size="md"
						className="size-11 active:bg-surface-analysis/50"
						aria-label={TOP_NAV_TEXT.NOTIFICATIONS_ARIA}
					>
						<BellIcon className="size-4" />
					</Button>
					<ThemeToggle />
					<Button
						variant="text"
						size="md"
						className="size-11 active:bg-surface-analysis/50"
						aria-label={TOP_NAV_TEXT.SETTINGS_ARIA}
						onClick={openSettingsDialog}
					>
						<GearIcon className="size-4" />
					</Button>
				</div>
			</div>
		</header>
	);
}
