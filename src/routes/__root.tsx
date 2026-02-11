import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/pages/not-found-page";
import { MarketsInfoProvider } from "@/lib/hyperliquid/hooks/MarketsInfoProvider";
import { buildPageHead, mergeHead } from "@/lib/seo";
import { ExchangeScopeProvider } from "@/providers/exchange-scope";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const seoHead = buildPageHead();
		return mergeHead(seoHead, {
			links: [{ rel: "stylesheet", href: appCss }],
		});
	},
	shellComponent: RootDocument,
	component: RootComponent,
	notFoundComponent: NotFoundPage,
});

function RootComponent() {
	return (
		<ExchangeScopeProvider>
			<MarketsInfoProvider>
				<Outlet />
			</MarketsInfoProvider>
		</ExchangeScopeProvider>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}
