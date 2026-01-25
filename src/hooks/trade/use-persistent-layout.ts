import { useCallback, useState } from "react";

export const LAYOUT_PRESETS = {
	MAIN_WORKSPACE: {
		storageKey: "terminal:layout:main",
		fallbackSizes: [82, 18] as const,
		defaultSizes: [78, 22] as const,
	},
	ANALYSIS_STACK: {
		storageKey: "terminal:layout:vert",
		fallbackSizes: [51, 49] as const,
		defaultSizes: [51, 49] as const,
	},
	MARKET_INFO: {
		storageKey: "terminal:layout:chart-book",
		fallbackSizes: [80, 20] as const,
		defaultSizes: [80, 20] as const,
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
