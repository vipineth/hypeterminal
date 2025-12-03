import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { getRootProviderContext, RootProvider } from "@/providers/root";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
	const rqContext = getRootProviderContext();

	const router = createRouter({
		routeTree,
		context: { ...rqContext },
		defaultPreload: "intent",
		Wrap: (props: { children: React.ReactNode }) => {
			return <RootProvider {...rqContext}>{props.children}</RootProvider>;
		},
	});

	setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient });

	return router;
};
