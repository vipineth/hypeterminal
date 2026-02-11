import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/perp")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Perpetuals Trading",
			description:
				"Trade perpetual futures on Hyperliquid DEX with up to 50x leverage, real-time charts, and advanced order types.",
			path: "/perp",
			keywords: ["perpetuals", "futures", "leverage", "trading"],
		}),
	component: TradeTerminalPage,
});
