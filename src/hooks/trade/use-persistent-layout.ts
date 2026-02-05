import { useDefaultLayout } from "react-resizable-panels";

const PERSIST_LAYOUTS = true;

export type PanelGroupKey = "CHART_WITH_SWAPBOX" | "CHART_WITH_POSITIONS" | "CHART_WITH_ORDERBOOK";

interface PanelConfig {
	id: string;
	defaultSize: string;
	minSize?: string;
	maxSize?: string;
}

interface LayoutConfig {
	id: string;
	orientation: "horizontal" | "vertical";
	panels: [PanelConfig, PanelConfig];
}

export const LAYOUT_CONFIG: Record<PanelGroupKey, LayoutConfig> = {
	CHART_WITH_SWAPBOX: {
		id: "terminal:layout:main",
		orientation: "horizontal",
		panels: [
			{ id: "main-chart", defaultSize: "78" },
			{ id: "main-sidebar", defaultSize: "22" },
		],
	},
	CHART_WITH_POSITIONS: {
		id: "terminal:layout:vert",
		orientation: "vertical",
		panels: [
			{ id: "vert-chart", defaultSize: "62" },
			{ id: "vert-positions", defaultSize: "38" },
		],
	},
	CHART_WITH_ORDERBOOK: {
		id: "terminal:layout:chart-book",
		orientation: "horizontal",
		panels: [
			{ id: "book-chart", defaultSize: "78" },
			{ id: "book-orderbook", defaultSize: "22" },
		],
	},
};

const noopStorage = {
	getItem: () => null,
	setItem: () => {},
};

function getStorage() {
	if (!PERSIST_LAYOUTS || typeof window === "undefined") return noopStorage;
	return localStorage;
}

export function usePersistentLayout(groupKey: PanelGroupKey) {
	const config = LAYOUT_CONFIG[groupKey];
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: config.id,
		panelIds: config.panels.map((p) => p.id),
		storage: getStorage(),
	});
	return { config, defaultLayout, onLayoutChanged };
}
