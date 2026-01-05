import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveTerminalPage } from "@/components/trade/responsive-terminal-page";
import { ROUTE_SEO } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		buildPageHead(ROUTE_SEO.TRADE),
	component: ResponsiveTerminalPage,
});
