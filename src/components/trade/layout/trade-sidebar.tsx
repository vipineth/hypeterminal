import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { AccountPanel } from "../tradebox/account-panel";
import { TradePanel } from "../tradebox/trade-panel";

export function TradeSidebar() {
	const { data: market } = useSelectedMarketInfo();
	const formKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0 flex flex-col overflow-y-auto bg-surface-execution terminal-grid">
			<TradePanel key={formKey} />
			<div className="flex-1 min-h-32" />
			<AccountPanel />
		</div>
	);
}
