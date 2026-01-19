import { useCallback, useState } from "react";

export const LAYOUT_PERSISTENCE = {
	MAIN: {
		KEY: "terminal:layout:main",
		FALLBACK: [82, 18] as const,
		PANEL_DEFAULTS: [78, 22],
	},
	VERTICAL: {
		KEY: "terminal:layout:vert",
		FALLBACK: [55, 45] as const,
		PANEL_DEFAULTS: [45, 55],
	},
	CHART_BOOK: {
		KEY: "terminal:layout:chart-book",
		FALLBACK: [75, 25] as const,
		PANEL_DEFAULTS: [70, 30],
	},
} as const;

function readStoredLayout(key: string, fallback: readonly number[]): number[] {
	if (typeof window === "undefined") return [...fallback];
	try {
		const stored = localStorage.getItem(key);
		if (!stored) return [...fallback];
		const arr = JSON.parse(stored);
		if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
			return arr;
		}
	} catch {
		// Ignore localStorage errors
	}
	return [...fallback];
}

export function usePersistentLayout(key: string, fallback: readonly number[]) {
	const [layout, setLayout] = useState<number[]>(() => readStoredLayout(key, fallback));

	const onLayout = useCallback(
		(sizes: number[]) => {
			setLayout(sizes);
			try {
				if (typeof window === "undefined") return;
				localStorage.setItem(key, JSON.stringify(sizes));
			} catch {
				// Ignore storage errors
			}
		},
		[key],
	);

	return { layout, onLayout } as const;
}
