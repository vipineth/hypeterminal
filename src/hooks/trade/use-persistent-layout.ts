import * as ResizablePrimitive from "react-resizable-panels";

export type PanelGroupKey = "CHART_WITH_SWAPBOX" | "CHART_WITH_POSITIONS" | "CHART_WITH_ORDERBOOK";

const LAYOUT_IDS: Record<PanelGroupKey, string> = {
	CHART_WITH_SWAPBOX: "terminal:layout:main",
	CHART_WITH_POSITIONS: "terminal:layout:vert",
	CHART_WITH_ORDERBOOK: "terminal:layout:chart-book",
};

export function usePersistentLayout(groupKey: PanelGroupKey) {
	return ResizablePrimitive.useDefaultLayout({
		id: LAYOUT_IDS[groupKey],
		storage: typeof window !== "undefined" ? localStorage : undefined,
	});
}
