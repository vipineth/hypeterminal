import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { AccountPanel } from "../tradebox/account-panel";
import { TradePanel } from "../tradebox/trade-panel";

export function TradeSidebar() {
	const { data: market } = useSelectedMarketInfo();
	const formKey = market?.name ?? "default";

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border-100 bg-card/95 backdrop-blur-xl">
			<TradePanel key={formKey} />
			<AccountPanel />
		</div>
	);
}
