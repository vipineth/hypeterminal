import { createFileRoute } from "@tanstack/react-router";
import { BuilderPage } from "@/components/pages/builder-page";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/builder")({
	head: () =>
		buildPageHead({
			title: "Register Builder Code",
			description: "Register a builder code to allow DeFi applications to charge fees on orders placed on your behalf.",
			path: "/builder",
			noIndex: true,
		}),
	component: BuilderPage,
});
