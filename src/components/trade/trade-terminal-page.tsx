import { FooterBar } from "./footer";
import { FavoritesStrip, TopNav } from "./header";
import { MainWorkspace } from "./layout";
import { useMarketPrefsMigrations } from "@/hooks/markets/use-market-prefs-migrations";

export function TradeTerminalPage() {
	useMarketPrefsMigrations();

	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono terminal-scanlines">
			<TopNav />
			<FavoritesStrip />
			<MainWorkspace />
			<FooterBar />
		</div>
	);
}
