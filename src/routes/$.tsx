import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>404 Page not found</div>;
}
