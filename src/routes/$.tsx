import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/pages/not-found-page";
import { ROUTE_SEO } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
	head: () =>
		buildPageHead(ROUTE_SEO.NOT_FOUND),
	component: NotFoundPage,
});
