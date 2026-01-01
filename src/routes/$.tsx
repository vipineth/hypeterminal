import { createFileRoute } from "@tanstack/react-router";
import { buildPageHead } from "@/lib/seo";

export const Route = createFileRoute("/$")({
	head: () =>
		buildPageHead({
			title: "Page Not Found",
			description: "The page you are looking for does not exist.",
			noIndex: true,
		}),
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<h1 className="text-4xl font-bold mb-4">404</h1>
			<p className="text-lg text-muted-foreground mb-4">Page not found</p>
			<a href="/" className="text-primary hover:underline">
				Go to trading terminal
			</a>
		</div>
	);
}
