import { OrderEntryPanel } from "../order-entry/order-entry-panel";
import { AccountPanel } from "../order-entry/account-panel";

export function OrderSidebar() {
	return (
		<div className="h-full min-h-0 flex flex-col">
			<div className="flex-1 min-h-0 overflow-hidden">
				<OrderEntryPanel />
			</div>
			<AccountPanel />
		</div>
	);
}

