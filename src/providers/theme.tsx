import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
const defaultTheme = "light";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: defaultTheme,
	setTheme: () => null,
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

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "hypeterminal-ui-theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(() => getStoredTheme(storageKey) || defaultTheme);

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

	const value = {
		theme,
		setTheme: (theme: Theme) => {
			const newTheme = setStoredTheme(storageKey, theme);
			setTheme(newTheme);
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
