import { createFileRoute } from "@tanstack/react-router";
import { ComponentShowcase } from "@/components/pages/component-showcase/component-showcase";
import { ROUTE_SEO } from "@/constants/app";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/components")({
	head: () =>
		buildPageHead(ROUTE_SEO.COMPONENTS),
	component: ComponentShowcase,
});
