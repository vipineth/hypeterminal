import { useState } from "react";

// Helper to safely read from localStorage (handles SSR)
function getStoredLayout(key: string, fallback: readonly number[]): number[] {
	if (typeof window === "undefined") return [...fallback];
	try {
		const stored = localStorage.getItem(key);
		if (stored) {
			const arr = JSON.parse(stored) as number[];
			if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
				return arr;
			}
		}
	} catch {
		// Ignore localStorage errors
	}
	return [...fallback];
}

export function usePersistentLayout(key: string, fallback: readonly number[]) {
	const [layout, setLayout] = useState<number[]>(() => getStoredLayout(key, fallback));

	const onLayout = (sizes: number[]) => {
		setLayout(sizes);
		try {
			localStorage.setItem(key, JSON.stringify(sizes));
		} catch {}
	};

	return { layout, onLayout } as const;
}

