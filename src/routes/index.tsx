import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade/TradeTerminalPage";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return <TradeTerminalPage />;
}
