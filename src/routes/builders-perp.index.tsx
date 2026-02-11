import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/builders-perp/")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Builder Perpetuals",
			description: "Trade builder-deployed perpetual markets (HIP-3) on Hyperliquid DEX.",
			path: "/builders-perp",
			keywords: ["builders", "hip-3", "perpetuals", "community"],
		}),
	component: TradeTerminalPage,
});
