import { t } from "@lingui/core/macro";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
		<div className="space-y-4">
			<Tabs
				value={tabsOrderType}
				onValueChange={(v) => {
					if (v === "market") onOrderTypeChange("market");
					else if (v === "limit") onOrderTypeChange("limit");
				}}
			>
				<TabsList variant="underline" className="w-full">
					<TabsTrigger value="market" className="flex-1 text-xs normal-case">{t`Market`}</TabsTrigger>
					<TabsTrigger value="limit" className="flex-1 text-xs normal-case">{t`Limit`}</TabsTrigger>
					<div className="relative inline-flex flex-1 items-center justify-center pb-2">
						<AdvancedOrderDropdown
							orderType={orderType}
							onOrderTypeChange={onOrderTypeChange}
							marketKind={marketKind}
							className={cn("text-xs normal-case", isAdvancedTab ? "font-semibold text-text-950" : "text-text-600")}
						/>
						{isAdvancedTab && <span aria-hidden className="absolute bottom-0 inset-x-0 h-0.5 bg-primary-default" />}
					</div>
				</TabsList>
			</Tabs>

			<SideToggle side={side} onSideChange={onSideChange} labels={sideLabels} />
		</div>
	);
}
