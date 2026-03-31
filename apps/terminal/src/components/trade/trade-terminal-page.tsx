import { Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { createLazyComponent } from "@/lib/lazy";
import { useGlobalSettings, useIsTestnet } from "@/stores/use-global-settings-store";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";
import { TestnetBanner } from "./testnet-banner";

const MobileTerminal = createLazyComponent(() => import("./mobile/mobile-terminal"), "MobileTerminal");

const GlobalModals = createLazyComponent(() => import("./components/global-modals"), "GlobalModals");

export function TradeTerminalPage() {
	useDocumentTitle();
	const isMobile = useIsMobile();
	const { showChartScanlines } = useGlobalSettings();
	const isTestnet = useIsTestnet();

	return (
		<>
			{isMobile ? (
				<Suspense fallback={<MobileLoadingFallback />}>
					<MobileTerminal />
				</Suspense>
			) : (
				<div
					className={cn(
						"bg-bg-sunken text-text-strong min-h-screen w-full flex flex-col font-sans pb-6",
						isTestnet ? "pt-[4.75rem]" : "pt-11",
						isTestnet && "testnet-bg",
						showChartScanlines && "terminal-scanlines",
					)}
				>
					<TestnetBanner />
					<TopNav />
					<MainWorkspace />
					<FooterBar />
				</div>
			)}
			<Suspense fallback={null}>
				<GlobalModals />
			</Suspense>
		</>
	);
}

function MobileLoadingFallback() {
	return (
		<div className="h-dvh w-full flex flex-col bg-bg-sunken text-text-strong font-sans overflow-hidden">
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
				<div className="flex-1 h-48 rounded bg-bg-raised/50 animate-pulse" />
				<div className="flex gap-3">
					<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
					<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
					<div className="h-4 w-16 rounded bg-bg-raised animate-pulse" />
				</div>
			</div>
			<div className="border-t border-stroke-weak/60 pb-[env(safe-area-inset-bottom)]">
				<div className="flex items-stretch">
					<NavSkeleton />
					<NavSkeleton />
					<NavSkeleton />
					<NavSkeleton />
					<NavSkeleton />
				</div>
			</div>
		</div>
	);
}

function NavSkeleton() {
	return (
		<div className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] py-2">
			<div className="size-5 rounded bg-bg-raised animate-pulse" />
			<div className="h-2 w-8 rounded bg-bg-raised animate-pulse" />
		</div>
	);
}
