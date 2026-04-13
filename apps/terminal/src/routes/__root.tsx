import type { QueryClient } from "@tanstack/react-query";
import { ClientOnly, createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { NotFoundPage } from "@/components/pages/not-found-page";
import { Toaster } from "@/components/ui/sonner";
import { MarketsInfoProvider } from "@/lib/hyperliquid/hooks/MarketsInfoProvider";
import { buildPageHead, mergeHead } from "@/lib/seo";
import { ExchangeScopeProvider } from "@/providers/exchange-scope";
import "@/bones/registry";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => {
		const seoHead = buildPageHead();
		return mergeHead(seoHead, {
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "preconnect", href: "https://api.hyperliquid.xyz" },
				{ rel: "dns-prefetch", href: "https://api.hyperliquid.xyz" },
				{ rel: "dns-prefetch", href: "https://app.hyperliquid.xyz" },
			],
		});
	},
	shellComponent: RootDocument,
	component: RootComponent,
	notFoundComponent: NotFoundPage,
});

function RootComponent() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js", { scope: "/" });
		}
	}, []);

	return (
		<ClientOnly fallback={<AppShellSkeleton />}>
			<ExchangeScopeProvider>
				<MarketsInfoProvider>
					<Outlet />
					<Toaster />
				</MarketsInfoProvider>
			</ExchangeScopeProvider>
		</ClientOnly>
	);
}

function AppShellSkeleton() {
	return (
		<>
			{/* Mobile shell — shown below md breakpoint */}
			<div className="md:hidden h-dvh w-full flex flex-col bg-bg-base overflow-hidden">
				<div className="pt-[env(safe-area-inset-top)] border-b border-stroke-weak/60">
					<div className="h-12 px-3 flex items-center justify-between">
						<div className="flex items-center gap-1.5">
							<div className="size-6 rounded bg-bg-raised animate-pulse" />
							<div className="h-3 w-20 rounded bg-bg-raised animate-pulse" />
						</div>
						<div className="flex items-center gap-2">
							<div className="size-8 rounded bg-bg-raised animate-pulse" />
							<div className="size-8 rounded bg-bg-raised animate-pulse" />
						</div>
					</div>
				</div>
				<div className="flex-1 min-h-0 p-4 space-y-3">
					<div className="h-5 w-32 rounded bg-bg-raised animate-pulse" />
					<div className="h-48 w-full rounded bg-bg-raised/50 animate-pulse" />
					<div className="flex gap-3">
						<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
						<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
						<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
					</div>
				</div>
				<div className="border-t border-stroke-weak/60 pb-[env(safe-area-inset-bottom)]">
					<div className="flex items-stretch">
						{["chart", "trade", "book", "positions", "account"].map((tab) => (
							<div key={tab} className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2">
								<div className="size-5 rounded bg-bg-raised animate-pulse" />
								<div className="h-2 w-8 rounded bg-bg-raised animate-pulse" />
							</div>
						))}
					</div>
				</div>
			</div>
			{/* Desktop shell — shown at md breakpoint and above */}
			<div className="hidden md:flex h-screen w-full flex-col bg-bg-base">
				<div className="h-11 border-b border-stroke-weak/60 px-3 flex items-center gap-3 shrink-0">
					<div className="h-4 w-32 rounded bg-bg-raised animate-pulse" />
					<div className="h-4 w-24 rounded bg-bg-raised animate-pulse ml-auto" />
				</div>
				<div className="flex-1 min-h-0 animate-pulse bg-bg-raised/20" />
			</div>
		</>
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
