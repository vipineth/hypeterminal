import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { AccountPanel } from "../tradebox/account-panel";
import { TradePanel } from "../tradebox/trade-panel";

export function TradeSidebar() {
	const { data: market } = useSelectedMarketInfo();
	const formKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0 flex flex-col overflow-y-auto gap-32 bg-surface-alt">
			<div className="flex-1 min-h-0">
				<TradePanel key={formKey} />
			</div>
			<div className="pb-32">
				<AccountPanel />
			</div>
		</div>
	);
}
