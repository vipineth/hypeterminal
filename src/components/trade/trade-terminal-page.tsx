import { Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useIsMobile } from "@/hooks/use-mobile";
import { createLazyComponent } from "@/lib/lazy";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";

const MobileTerminal = createLazyComponent(() => import("./mobile/mobile-terminal"), "MobileTerminal");

const GlobalModals = createLazyComponent(() => import("./components/global-modals"), "GlobalModals");

export function TradeTerminalPage() {
	useDocumentTitle();
	const isMobile = useIsMobile();

	return (
		<>
			{isMobile ? (
				<Suspense fallback={<MobileLoadingFallback />}>
					<MobileTerminal />
				</Suspense>
			) : (
				<div className="flex min-h-screen w-full flex-col bg-surface-base text-text-950 pt-14 pb-8">
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
		<div className="flex h-dvh w-full items-center justify-center bg-surface-base text-text-950">
			<div className="animate-pulse text-fg-600">Loading...</div>
		</div>
	);
}
