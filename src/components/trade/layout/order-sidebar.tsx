import { useSelectedResolvedMarket } from "@/lib/hyperliquid";
import { AccountPanel } from "../order-entry/account-panel";
import { OrderEntryPanel } from "../order-entry/order-entry-panel";

export function OrderSidebar() {
	// React 19: Use key prop to reset form when market changes
	const { data: market } = useSelectedResolvedMarket({ ctxMode: "none" });
	const formKey = market?.marketKey ?? "default";

	return (
		<div className="h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 overflow-hidden">
				{/* Key resets form state when market changes */}
				<OrderEntryPanel key={formKey} />
			</div>
			<AccountPanel />
		</div>
	);
}
