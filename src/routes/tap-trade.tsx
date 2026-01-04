import { createFileRoute } from "@tanstack/react-router";
import { TapTradePage } from "@/components/tap/tap-trade-page";
import { ROUTE_SEO } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/tap-trade")({
	head: () =>
		buildPageHead({
			title: "Tap Trade",
			description: "Tap to trade - predict price movements with leveraged positions on Hyperliquid.",
			path: "/tap-trade",
			keywords: ["tap", "trade", "predict", "leverage", "perpetuals"],
		}),
	component: TapTradePage,
});
