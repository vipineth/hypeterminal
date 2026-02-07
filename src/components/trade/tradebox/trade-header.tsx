import { t } from "@lingui/core/macro";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SideLabels } from "@/domain/trade/order/labels";
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

	return (
		<div className="space-y-6">
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
					<TabsTrigger value="advanced" className="flex-1 text-xs normal-case">
						<AdvancedOrderDropdown
							orderType={orderType}
							onOrderTypeChange={onOrderTypeChange}
							marketKind={marketKind}
						/>
					</TabsTrigger>
				</TabsList>
			</Tabs>

			<SideToggle side={side} onSideChange={onSideChange} labels={sideLabels} />
		</div>
	);
}
