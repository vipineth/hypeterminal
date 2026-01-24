import { useSelectedMarketInfo } from "@/lib/hyperliquid";
import { AccountPanel } from "../order-entry/account-panel";
import { OrderEntryPanel } from "../order-entry/order-entry-panel";

export function OrderSidebar() {
	const { data: market } = useSelectedMarketInfo();
	const formKey = market?.name ?? "default";

	return (
		<div className="h-full min-h-0 flex flex-col overflow-y-auto gap-32">
			<div className="flex-1 min-h-0">
				<OrderEntryPanel key={formKey} />
			</div>
			<div className="pb-32">
				<AccountPanel />
			</div>
		</div>
	);
}
