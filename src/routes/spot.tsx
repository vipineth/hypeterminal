import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/spot")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Spot Trading",
			description: "Trade spot markets on Hyperliquid DEX with real-time orderbook, charts, and instant execution.",
			path: "/spot",
			keywords: ["spot", "trading", "exchange"],
		}),
	component: TradeTerminalPage,
});
