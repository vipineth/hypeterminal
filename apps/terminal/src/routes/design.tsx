import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/design")({
	ssr: false,
	head: () =>
		buildPageHead({
			title: "Design System",
			description: "Design showcase removed.",
			path: "/design",
		}),
	component: function DesignRoute() {
		return <div className="flex h-screen items-center justify-center text-text-weak">Design showcase removed</div>;
	},
});
