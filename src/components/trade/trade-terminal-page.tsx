import { useMarketPrefsMigrations } from "@/hooks/markets/use-market-prefs-migrations";
import { FooterBar } from "./footer";
import { FavoritesStrip, TopNav } from "./header";
import { MainWorkspace } from "./layout";

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
