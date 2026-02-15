import { CHART_LIBRARY_PATH } from "@/config/constants";

let loadPromise: Promise<void> | null = null;

export function loadTradingViewScript(): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if (window.TradingView) return Promise.resolve();

	if (!loadPromise) {
		loadPromise = new Promise<void>((resolve, reject) => {
			const script = document.createElement("script");
			script.src = `${CHART_LIBRARY_PATH}charting_library.js`;
			script.async = true;

			const timeout = setTimeout(() => {
				script.remove();
				loadPromise = null;
				reject(new Error("TradingView script load timeout"));
			}, 30000);

			script.onload = () => {
				clearTimeout(timeout);
				resolve();
			};

			script.onerror = () => {
				clearTimeout(timeout);
				loadPromise = null;
				reject(new Error("Failed to load TradingView library"));
			};

			document.head.appendChild(script);
		});
	}

	return loadPromise;
}
