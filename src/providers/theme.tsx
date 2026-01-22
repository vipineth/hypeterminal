import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
const defaultTheme = "light";

export type ColorTheme = "terminal" | "midnight" | "arctic";
const defaultColorTheme: ColorTheme = "terminal";

export const colorThemes: { id: ColorTheme; name: string; description: string }[] = [
	{ id: "terminal", name: "Terminal", description: "Indigo accent, neutral grays" },
	{ id: "midnight", name: "Midnight", description: "Deep blues, violet accents" },
	{ id: "arctic", name: "Arctic", description: "Cool cyan, frost blues" },
];

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
	colorThemeStorageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	colorTheme: ColorTheme;
	setColorTheme: (colorTheme: ColorTheme) => void;
};

const initialState: ThemeProviderState = {
	theme: defaultTheme,
	setTheme: () => null,
	colorTheme: defaultColorTheme,
	setColorTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function getStoredTheme(storageKey: string) {
	if (typeof window === "undefined") return defaultTheme;
	const storedTheme = localStorage.getItem(storageKey);
	return (storedTheme as Theme) ?? defaultTheme;
}

function setStoredTheme(storageKey: string, theme: Theme) {
	if (typeof window === "undefined") return defaultTheme;
	localStorage.setItem(storageKey, theme);
	return theme;
}

function getStoredColorTheme(storageKey: string): ColorTheme {
	if (typeof window === "undefined") return defaultColorTheme;
	const stored = localStorage.getItem(storageKey);
	if (stored && colorThemes.some((t) => t.id === stored)) {
		return stored as ColorTheme;
	}
	return defaultColorTheme;
}

function setStoredColorTheme(storageKey: string, colorTheme: ColorTheme): ColorTheme {
	if (typeof window === "undefined") return defaultColorTheme;
	localStorage.setItem(storageKey, colorTheme);
	return colorTheme;
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "hypeterminal-ui-theme",
	colorThemeStorageKey = "hypeterminal-color-theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(() => getStoredTheme(storageKey) || defaultTheme);
	const [colorTheme, setColorTheme] = useState<ColorTheme>(() => getStoredColorTheme(colorThemeStorageKey));

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(theme);
	}, [theme]);

	useEffect(() => {
		const root = window.document.documentElement;
		root.setAttribute("data-color-theme", colorTheme);
	}, [colorTheme]);

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			const newTheme = setStoredTheme(storageKey, theme);
			setTheme(newTheme);
		},
		colorTheme,
		setColorTheme: (colorTheme: ColorTheme) => {
			const newColorTheme = setStoredColorTheme(colorThemeStorageKey, colorTheme);
			setColorTheme(newColorTheme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
