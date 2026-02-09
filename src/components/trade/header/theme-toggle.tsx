import { t } from "@lingui/core/macro";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTheme } from "@/stores/use-global-settings-store";

export function ThemeToggle() {
	return (
		<ClientOnly>
			<ThemeToggleButton />
		</ClientOnly>
	);
}

function ThemeToggleButton() {
	const { theme, setTheme } = useTheme();

	const isDark = theme === "dark";

	return (
		<Button
			variant="text"
			size="sm"
			className={cn(
				"size-7",
				isDark ? "text-warning-700 hover:text-warning-700/80" : "text-primary-default hover:text-primary-default/80",
			)}
			onClick={() => setTheme(isDark ? "light" : "dark")}
			aria-label={isDark ? t`Switch to light mode` : t`Switch to dark mode`}
		>
			{isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
		</Button>
	);
}
