import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		buildPageHead({
			title: "Trade",
			description:
				"Trade perpetuals and spot markets on Hyperliquid DEX with real-time charts, orderbook, and one-click order execution.",
			path: "/",
			keywords: ["trade", "orderbook", "chart", "perpetuals", "spot"],
		}),
	component: TradeTerminalPage,
});
