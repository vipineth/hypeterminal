import { createFileRoute } from "@tanstack/react-router";
import { ColorsPage } from "@/components/pages/colors-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/colors")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Design Tokens",
			description: "All color tokens used in the design system.",
			path: "/colors",
			keywords: ["colors", "design tokens", "theme"],
		}),
	component: ColorsPage,
});
