import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/pages/not-found-page";
import { ROUTE_SEO } from "@/config/constants";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
	ssr: false,
	head: () => buildPageHead(ROUTE_SEO.NOT_FOUND),
	component: NotFoundPage,
});
