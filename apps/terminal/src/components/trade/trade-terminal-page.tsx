import { Suspense } from "react";
import {
	APP_HEADER_OFFSET_CLASS,
	APP_HEADER_PLUS_BANNER_OFFSET_CLASS,
	MOBILE_BOTTOM_NAV_HEIGHT_PX,
	MOBILE_BREAKPOINT_PX,
} from "@/config/layout";
import { TabTitleSync } from "@/hooks/use-document-title";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/cn";
import { createLazyComponent } from "@/lib/lazy";
import { useIsTestnet } from "@/stores/use-global-settings-store";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";
import { TestnetBanner } from "./testnet-banner";

const MobileTerminal = createLazyComponent(() => import("./mobile/mobile-terminal"), "MobileTerminal");

const GlobalModals = createLazyComponent(() => import("./components/global-modals"), "GlobalModals");
const FooterBar = createLazyComponent(() => import("./footer/footer-bar"), "FooterBar");

if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT_PX) {
	MobileTerminal.preload?.();
}

export function TradeTerminalPage() {
	const isMobile = useIsMobile();
	const isTestnet = useIsTestnet();

	return (
		<>
			<TabTitleSync />
			{isMobile ? (
				<Suspense fallback={<MobileLoadingFallback />}>
					<MobileTerminal />
				</Suspense>
			) : (
				<div
					className={cn(
						"bg-background text-fg min-h-dvh w-full flex flex-col overflow-x-hidden font-sans pb-8",
						isTestnet ? APP_HEADER_PLUS_BANNER_OFFSET_CLASS : APP_HEADER_OFFSET_CLASS,
						isTestnet && "testnet-bg",
					)}
				>
					<TestnetBanner />
					<TopNav />
					<MainWorkspace />
					<Suspense fallback={null}>
						<FooterBar />
					</Suspense>
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
		<div className="h-dvh w-full flex flex-col bg-background text-fg font-sans overflow-hidden">
			<div className="pt-[env(safe-area-inset-top)] border-b border-stroke-weak/60">
				<div className="h-12 px-3 flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<div className="size-6 rounded bg-surface animate-pulse" />
						<div className="h-3 w-20 rounded bg-surface animate-pulse" />
					</div>
					<div className="flex items-center gap-2">
						<div className="size-8 rounded bg-surface animate-pulse" />
						<div className="size-8 rounded bg-surface animate-pulse" />
					</div>
				</div>
			</div>
			<div className="flex-1 min-h-0 p-4 space-y-3">
				<div className="h-5 w-32 rounded bg-surface animate-pulse" />
				<div className="flex-1 h-48 rounded bg-surface/50 animate-pulse" />
				<div className="flex gap-3">
					<div className="h-4 w-16 rounded bg-surface animate-pulse" />
					<div className="h-4 w-16 rounded bg-surface animate-pulse" />
					<div className="h-4 w-16 rounded bg-surface animate-pulse" />
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
		<div
			className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
			style={{ minHeight: MOBILE_BOTTOM_NAV_HEIGHT_PX }}
		>
			<div className="size-5 rounded bg-surface animate-pulse" />
			<div className="h-2 w-8 rounded bg-surface animate-pulse" />
		</div>
	);
}
