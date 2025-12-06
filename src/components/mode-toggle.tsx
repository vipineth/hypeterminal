import { ClientOnly } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme";

function ModeToggleComponent() {
	const { theme, setTheme } = useTheme();

	const handleToggle = () => {
		const isDark =
			theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
		setTheme(isDark ? "light" : "dark");
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleToggle();
		}
	};

	const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

	return (
		<Button
			variant="outline"
			size="sm"
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			onClick={handleToggle}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			{isDark ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
		</Button>
	);
}

export function ModeToggle() {
	return (
		<ClientOnly>
			<ModeToggleComponent />
		</ClientOnly>
	);
}
