import { createFileRoute } from "@tanstack/react-router";
import { DesignSystemPage } from "@/components/pages/design-system-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design-system")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Design System",
			description: "Native shadcn baseline, semantic theme tokens, and component usage guidance.",
			path: "/design-system",
			keywords: ["design system", "shadcn", "theme", "tokens"],
		}),
	component: DesignSystemPage,
});
