import { useEffect, useState } from "react";

export type PanelGroupKey = "CHART_WITH_SWAPBOX" | "CHART_WITH_POSITIONS" | "CHART_WITH_ORDERBOOK";

export const PANEL_PRESETS: Record<PanelGroupKey, { storageKey: string; defaults: readonly number[] }> = {
	CHART_WITH_SWAPBOX: { storageKey: "terminal:layout:main", defaults: [76, 24] },
	CHART_WITH_POSITIONS: { storageKey: "terminal:layout:vert", defaults: [60, 40] },
	CHART_WITH_ORDERBOOK: { storageKey: "terminal:layout:chart-book", defaults: [76, 24] },
};

function isValidSizes(value: unknown, length: number): value is number[] {
	if (!Array.isArray(value) || value.length !== length) return false;
	return value.every((size) => typeof size === "number" && Number.isFinite(size));
}

function readSizes(key: string, defaults: readonly number[]): number[] {
	if (typeof window === "undefined") return [...defaults];
	try {
		const stored = localStorage.getItem(key);
		if (!stored) return [...defaults];
		const parsed = JSON.parse(stored);
		if (isValidSizes(parsed, defaults.length)) return parsed;
	} catch {}
	return [...defaults];
}

export function usePersistentPanelSizes(groupKey: PanelGroupKey) {
	const { storageKey, defaults } = PANEL_PRESETS[groupKey];
	const [sizes, setSizes] = useState<number[]>([...defaults]);

	useEffect(() => {
		setSizes(readSizes(storageKey, defaults));
	}, [storageKey, defaults]);

	function handleSizesChange(next: number[]): void {
		if (!isValidSizes(next, defaults.length)) return;
		setSizes(next);
		try {
			localStorage.setItem(storageKey, JSON.stringify(next));
		} catch {}
	}

	return { sizes, onSizesChange: handleSizesChange } as const;
}
