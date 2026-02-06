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
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-2">
				<Tabs value={tabsOrderType} onValueChange={(v) => onOrderTypeChange(v as "market" | "limit")}>
					<TabsList variant="underline">
						<TabsTrigger value="market">{t`Market`}</TabsTrigger>
						<TabsTrigger value="limit">{t`Limit`}</TabsTrigger>
					</TabsList>
				</Tabs>
				<AdvancedOrderDropdown orderType={orderType} onOrderTypeChange={onOrderTypeChange} marketKind={marketKind} />
			</div>

			<SideToggle side={side} onSideChange={onSideChange} labels={sideLabels} />
		</div>
	);
}
