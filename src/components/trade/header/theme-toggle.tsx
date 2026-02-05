import { t } from "@lingui/core/macro";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTheme } from "@/providers/theme";

export function ThemeToggle() {
	return (
		<ClientOnly>
			<ThemeToggleButton />
		</ClientOnly>
	);
}

function ThemeToggleButton() {
	const { theme, setTheme } = useTheme();

	const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	const handleToggle = () => {
		setTheme(isDark ? "light" : "dark");
	};

	return (
		<Button
			variant="text"
			size="none"
			className={cn("size-7", isDark ? "text-warning hover:text-warning/80" : "text-highlight hover:text-highlight/80")}
			onClick={handleToggle}
			aria-label={isDark ? t`Switch to light mode` : t`Switch to dark mode`}
		>
			{isDark ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
		</Button>
	);
}
