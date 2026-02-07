import { Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { createLazyComponent } from "@/lib/lazy";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";

const MobileTerminal = createLazyComponent(() => import("./mobile/mobile-terminal"), "MobileTerminal");

const GlobalModals = createLazyComponent(() => import("./components/global-modals"), "GlobalModals");

export function TradeTerminalPage() {
	const isMobile = useIsMobile();

	return (
		<>
			{isMobile ? (
				<Suspense fallback={<MobileLoadingFallback />}>
					<MobileTerminal />
				</Suspense>
			) : (
				<div className="bg-surface-200 text-fg-900 min-h-screen w-full flex flex-col font-mono terminal-scanlines pt-11 pb-6">
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
		<div className="h-dvh w-full flex items-center justify-center bg-surface-200 text-fg-900">
			<div className="animate-pulse text-fg-700">Loading...</div>
		</div>
	);
}
