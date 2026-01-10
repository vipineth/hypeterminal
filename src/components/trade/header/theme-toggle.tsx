import { t } from "@lingui/core/macro";
import { ClientOnly } from "@tanstack/react-router";
import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
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
			variant="ghost"
			size="icon-sm"
			className={clsx(
				"size-7",
				isDark ? "text-terminal-amber hover:text-terminal-amber/80" : "text-terminal-purple hover:text-terminal-purple/80",
			)}
			onClick={handleToggle}
			aria-label={isDark ? t`Switch to light mode` : t`Switch to dark mode`}
		>
			{isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
		</Button>
	);
}
