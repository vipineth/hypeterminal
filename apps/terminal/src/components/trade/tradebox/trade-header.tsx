import { Tabs, TabsList, TabsTrigger } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import type { SideLabels } from "@/domain/trade/order/labels";
import { cn } from "@/lib/cn";
import type { MarketKind } from "@/lib/hyperliquid";
import { getTabsOrderType, type OrderType } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";
import { AdvancedOrderDropdown } from "./advanced-order-dropdown";
import { SideToggle } from "./side-toggle";

interface Props {
	orderType: OrderType;
	side: Side;
	sideLabels: SideLabels;
	marketKind: MarketKind | undefined;
	onOrderTypeChange: (type: OrderType) => void;
	onSideChange: (side: Side) => void;
}

export function TradeHeader({ orderType, side, sideLabels, marketKind, onOrderTypeChange, onSideChange }: Props) {
	const tabsOrderType = getTabsOrderType(orderType);
	const isAdvancedTab = tabsOrderType === "advanced";

	return (
		<div className="space-y-4 min-w-0">
			<Tabs
				value={tabsOrderType}
				onValueChange={(v) => {
					if (v === "market") onOrderTypeChange("market");
					else if (v === "limit") onOrderTypeChange("limit");
				}}
				fullWidth
			>
				<TabsList>
					<TabsTrigger value="market" className="flex-1 normal-case">{t`Market`}</TabsTrigger>
					<TabsTrigger value="limit" className="flex-1 normal-case">{t`Limit`}</TabsTrigger>
					<div className="relative inline-flex flex-1 items-center justify-center pb-2">
						<AdvancedOrderDropdown
							orderType={orderType}
							onOrderTypeChange={onOrderTypeChange}
							marketKind={marketKind}
							className={cn("text-xs normal-case", isAdvancedTab ? "font-semibold text-text-strong" : "text-text-weak")}
						/>
						{isAdvancedTab && <span aria-hidden className="absolute bottom-0 inset-x-0 h-0.5 bg-fill-brand-strong" />}
					</div>
				</TabsList>
			</Tabs>

			<SideToggle side={side} onSideChange={onSideChange} labels={sideLabels} />
		</div>
	);
}
