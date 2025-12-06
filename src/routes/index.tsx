import { createFileRoute } from "@tanstack/react-router";
import { TradeTerminalPage } from "@/components/trade";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return <TradeTerminalPage />;
}
