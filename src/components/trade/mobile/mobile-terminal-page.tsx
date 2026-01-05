import { useState } from "react";
import { useMarketPrefsMigrations } from "@/hooks/markets/use-market-prefs-migrations";
import { MobileHeader } from "./mobile-header";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileTradeView } from "./mobile-trade-view";
import { MobilePositionsView } from "./mobile-positions-view";
import { MobileMarketsView } from "./mobile-markets-view";

type MobileView = "trade" | "positions" | "markets";

export function MobileTerminalPage() {
	useMarketPrefsMigrations();
	const [activeView, setActiveView] = useState<MobileView>("trade");

	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono">
			<MobileHeader />

			<main className="flex-1 min-h-0 overflow-hidden">
				{activeView === "trade" && <MobileTradeView />}
				{activeView === "positions" && <MobilePositionsView />}
				{activeView === "markets" && <MobileMarketsView />}
			</main>

			<MobileBottomNav activeView={activeView} onViewChange={setActiveView} />
		</div>
	);
}
