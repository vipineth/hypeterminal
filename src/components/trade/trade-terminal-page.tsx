import { TopNav, TickerStrip } from "./header";
import { FooterBar } from "./footer";
import { MainWorkspace } from "./layout";

export function TradeTerminalPage() {
	return (
		<div className="bg-background text-foreground h-screen w-full flex flex-col font-mono terminal-scanlines">
			<TopNav />
			<TickerStrip />
			<MainWorkspace />
			<FooterBar />
		</div>
	);
}

