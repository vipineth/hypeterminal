import { useEffect, useMemo, useState } from "react";

function readStoredLayout(key: string): number[] | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(key);
		if (!stored) return null;
		const arr = JSON.parse(stored);
		if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
			return arr;
		}
	} catch {
		// Ignore localStorage errors
	}
	return null;
}

export function usePersistentLayout(key: string, fallback: readonly number[]) {
	const fallbackLayout = useMemo(() => [...fallback], [fallback]);
	const [layout, setLayout] = useState<number[]>(() => [...fallbackLayout]);

	useEffect(() => {
		const stored = readStoredLayout(key);
		if (stored) {
			setLayout(stored);
		}
	}, [key, fallbackLayout]);

	const onLayout = (sizes: number[]) => {
		setLayout(sizes);
		try {
			localStorage.setItem(key, JSON.stringify(sizes));
		} catch {
			// Ignore storage errors
		}
	};

	return { layout, onLayout } as const;
}
