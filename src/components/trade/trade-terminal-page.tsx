// import { useMarketPrefsMigrations } from "@/hooks/markets/use-market-prefs-migrations";
import { useIsMobile } from "@/hooks/use-mobile";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";
import { MobileTerminal } from "./mobile";

export function TradeTerminalPage() {
	// useMarketPrefsMigrations();
	const isMobile = useIsMobile();

	// Render mobile-optimized PWA layout
	if (isMobile) {
		return <MobileTerminal />;
	}

	// Desktop layout
	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono terminal-scanlines">
			<TopNav />
			<MainWorkspace />
			<FooterBar />
		</div>
	);
}
