import { useIsMobile } from "@/hooks/use-mobile";
import { GlobalModals } from "./components/global-modals";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";
import { MobileTerminal } from "./mobile/mobile-terminal";

export function TradeTerminalPage() {
	const isMobile = useIsMobile();

	return (
		<>
			{isMobile ? (
				<MobileTerminal />
			) : (
				<div className="bg-background text-foreground min-h-screen w-full flex flex-col font-mono terminal-scanlines pt-11 pb-6">
					<TopNav />
					<MainWorkspace />
					<FooterBar />
				</div>
			)}
			<GlobalModals />
		</>
	);
}
