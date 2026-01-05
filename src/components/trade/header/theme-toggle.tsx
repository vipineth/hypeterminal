import { t } from "@lingui/core/macro";
import { ClientOnly } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
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

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleToggle();
		}
	};

	return (
		<button
			type="button"
			className={cn(
				"size-7 flex items-center justify-center transition-colors",
				isDark
					? "text-terminal-amber hover:text-terminal-amber/80"
					: "text-terminal-purple hover:text-terminal-purple/80",
			)}
			onClick={handleToggle}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			aria-label={isDark ? t`Switch to light mode` : t`Switch to dark mode`}
		>
			{isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
		</button>
	);
}
