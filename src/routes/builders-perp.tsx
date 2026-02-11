import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/builders-perp")({
	component: () => <Outlet />,
});
