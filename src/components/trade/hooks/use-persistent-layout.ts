import { useEffect, useState } from "react";

export function usePersistentLayout(key: string, fallback: readonly number[]) {
	const [layout, setLayout] = useState<number[]>([...fallback]);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(key);
			if (stored) {
				const arr = JSON.parse(stored) as number[];
				if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
					setLayout(arr);
				}
			}
		} catch {}
	}, [key]);

	const onLayout = (sizes: number[]) => {
		setLayout(sizes);
		try {
			localStorage.setItem(key, JSON.stringify(sizes));
		} catch {}
	};

	return { layout, onLayout } as const;
}

