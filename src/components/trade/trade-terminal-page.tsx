import { useMarketPrefsMigrations } from "@/hooks/markets/use-market-prefs-migrations";
import { FooterBar } from "./footer/footer-bar";
import { TopNav } from "./header/top-nav";
import { MainWorkspace } from "./layout/main-workspace";

export function TradeTerminalPage() {
	useMarketPrefsMigrations();

	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono terminal-scanlines">
			<TopNav />
			<MainWorkspace />
			<FooterBar />
		</div>
	);
}
