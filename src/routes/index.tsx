import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/trade-terminal-page";
import { ROUTE_SEO } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		buildPageHead(ROUTE_SEO.TRADE),
	component: TradeTerminalPage,
});
