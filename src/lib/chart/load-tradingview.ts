import { CHART_LIBRARY_PATH } from "@/config/constants";
import { loadScript } from "@/lib/load-script";

export const TRADINGVIEW_SCRIPT_SRC = `${CHART_LIBRARY_PATH}charting_library.js`;

export function loadTradingViewScript(): Promise<void> {
	return loadScript(TRADINGVIEW_SCRIPT_SRC, {
		timeoutMs: 30000,
		isReady: () => typeof window !== "undefined" && Boolean(window.TradingView),
	});
}
