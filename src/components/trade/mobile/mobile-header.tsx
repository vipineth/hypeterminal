import clsx from "clsx";
import { Bell, Cog, Terminal } from "lucide-react";
import { useState } from "react";
import { UI_TEXT } from "@/config/interface";
import { GlobalSettingsDialog } from "../components/global-settings-dialog";
import { ThemeToggle } from "../header/theme-toggle";
import { UserMenu } from "../header/user-menu";

const TOP_NAV_TEXT = UI_TEXT.TOP_NAV;

interface Props {
	className?: string;
}

export function MobileHeader({ className }: Props) {
	const [settingsOpen, setSettingsOpen] = useState(false);

	return (
		<header
			className={clsx(
				"pt-[env(safe-area-inset-top)]",
				"sticky top-0 z-40 bg-background/95 backdrop-blur-sm",
				"border-b border-border/60",
				className,
			)}
		>
			<div className="h-12 px-3 flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<div className="size-6 rounded bg-terminal-green/20 border border-terminal-green/40 flex items-center justify-center">
						<Terminal className="size-3.5 text-terminal-green" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-terminal-cyan">
						{TOP_NAV_TEXT.BRAND_PREFIX}
						<span className="text-foreground">{TOP_NAV_TEXT.BRAND_SUFFIX}</span>
					</span>
				</div>

				<div className="flex items-center gap-1">
					<UserMenu />
					<button
						type="button"
						className={clsx(
							"size-11 flex items-center justify-center",
							"text-muted-foreground hover:text-foreground",
							"active:bg-accent/50 rounded-md transition-colors",
						)}
						tabIndex={0}
						aria-label={TOP_NAV_TEXT.NOTIFICATIONS_ARIA}
					>
						<Bell className="size-4" />
					</button>
					<ThemeToggle />
					<button
						type="button"
						className={clsx(
							"size-11 flex items-center justify-center",
							"text-muted-foreground hover:text-foreground",
							"active:bg-accent/50 rounded-md transition-colors",
						)}
						tabIndex={0}
						aria-label={TOP_NAV_TEXT.SETTINGS_ARIA}
						onClick={() => setSettingsOpen(true)}
					>
						<Cog className="size-4" />
					</button>
				</div>
			</div>

			<GlobalSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</header>
	);
}
