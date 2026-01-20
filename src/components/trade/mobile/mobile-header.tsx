import { Bell, Cog, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/config/constants";
import { cn } from "@/lib/cn";
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
			className={cn(
				"pt-[env(safe-area-inset-top)]",
				"sticky top-0 z-40 bg-bg/95 backdrop-blur-sm",
				"border-b border-border/60",
				className,
			)}
		>
			<div className="h-12 px-3 flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<div className="size-6 rounded bg-positive/20 border border-positive/40 flex items-center justify-center">
						<Terminal className="size-3.5 text-positive" />
					</div>
					<span className="text-xs font-semibold tracking-tight text-info">
						{TOP_NAV_TEXT.BRAND_PREFIX}
						<span className="text-fg">{TOP_NAV_TEXT.BRAND_SUFFIX}</span>
					</span>
				</div>

				<div className="flex items-center gap-1">
					<UserMenu />
					<Button
						variant="ghost"
						size="icon-lg"
						className="size-11 active:bg-accent/50"
						aria-label={TOP_NAV_TEXT.NOTIFICATIONS_ARIA}
					>
						<Bell className="size-4" />
					</Button>
					<ThemeToggle />
					<Button
						variant="ghost"
						size="icon-lg"
						className="size-11 active:bg-accent/50"
						aria-label={TOP_NAV_TEXT.SETTINGS_ARIA}
						onClick={() => setSettingsOpen(true)}
					>
						<Cog className="size-4" />
					</Button>
				</div>
			</div>

			<GlobalSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</header>
	);
}
