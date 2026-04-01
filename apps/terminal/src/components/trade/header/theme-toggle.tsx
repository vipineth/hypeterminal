import { ButtonIcon } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { ClientOnly } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { useSetTheme, useTheme } from "@/stores/use-global-settings-store";

export function ThemeToggle() {
	return (
		<ClientOnly>
			<ThemeToggleButton />
		</ClientOnly>
	);
}

function ThemeToggleButton() {
	const theme = useTheme();
	const setTheme = useSetTheme();

	const isDark = theme === "dark";

	return (
		<ButtonIcon
			variant="ghost"
			intent="neutral"
			className={cn(
				"size-7",
				isDark ? "text-text-warning hover:text-text-warning/80" : "text-text-brand hover:text-text-brand/80",
			)}
			onClick={() => setTheme(isDark ? "light" : "dark")}
			aria-label={isDark ? t`Switch to light mode` : t`Switch to dark mode`}
		>
			{isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
		</ButtonIcon>
	);
}
