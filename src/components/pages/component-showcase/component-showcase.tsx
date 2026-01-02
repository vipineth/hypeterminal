import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/constants/app";
import { useTheme } from "@/providers/theme";
import { SHOWCASE_SECTIONS } from "./component-showcase-data";
import { ShowcaseSection } from "./showcase-section";

const SHOWCASE_TEXT = UI_TEXT.COMPONENT_SHOWCASE;

function prefersDarkMode() {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ComponentShowcase() {
	const { theme, setTheme } = useTheme();
	const isDark = theme === "dark" || (theme === "system" && prefersDarkMode());

	const handleThemeToggle = () => {
		setTheme(isDark ? "light" : "dark");
	};

	return (
		<div className="min-h-screen bg-background text-foreground p-6">
			<div className="max-w-5xl mx-auto space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-xl font-bold">{SHOWCASE_TEXT.TITLE}</h1>
						<p className="text-sm text-muted-foreground">{SHOWCASE_TEXT.SUBTITLE}</p>
					</div>
					<Button variant="outline" size="sm" onClick={handleThemeToggle}>
						{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
						<span>{isDark ? SHOWCASE_TEXT.THEME_TOGGLE.LIGHT : SHOWCASE_TEXT.THEME_TOGGLE.DARK}</span>
					</Button>
				</div>

				{SHOWCASE_SECTIONS.map((section) => (
					<ShowcaseSection key={section.id} title={section.title}>
						{section.render()}
					</ShowcaseSection>
				))}
			</div>
		</div>
	);
}
