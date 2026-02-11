import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/builders-perp/$dex")({
	ssr: false,
	head: ({ params }) =>
		buildPageHead({
			title: `${params.dex} Markets`,
			description: `Trade ${params.dex} perpetual markets on Hyperliquid DEX.`,
			path: `/builders-perp/${params.dex}`,
			keywords: ["builders", "hip-3", params.dex],
		}),
	component: TradeTerminalPage,
});
