import { useCallback, useState } from "react";

export const LAYOUT_PRESETS = {
	MAIN_WORKSPACE: {
		storageKey: "terminal:layout:main",
		fallbackSizes: [82, 18] as const,
		defaultSizes: [78, 22],
	},
	ANALYSIS_STACK: {
		storageKey: "terminal:layout:vert",
		fallbackSizes: [50, 50] as const,
		defaultSizes: [40, 60],
	},
	MARKET_INFO: {
		storageKey: "terminal:layout:chart-book",
		fallbackSizes: [75, 25] as const,
		defaultSizes: [75, 25],
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
	const [sizes, setSizes] = useState<number[]>(() => readStoredLayout(key, fallback));

	const handleLayoutChange = useCallback(
		function handleLayoutChange(nextSizes: number[]) {
			setSizes(nextSizes);
			try {
				if (typeof window === "undefined") return;
				localStorage.setItem(key, JSON.stringify(nextSizes));
			} catch {
				// Ignore storage errors
			}
		},
		[key],
	);

	return { sizes, handleLayoutChange } as const;
}
