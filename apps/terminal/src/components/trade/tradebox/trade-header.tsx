import { Dropdown } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { OrderType } from "@/config/trade";
import type { SideLabels } from "@/config/ui-text";
import type { MarketKind } from "@/lib/hyperliquid";
import type { MarginMode } from "@/lib/trade/margin-mode";
import { getAdvancedOrderLabel, getTabsOrderType } from "@/lib/trade/order-types";
import type { Side } from "@/lib/trade/types";
import { SideToggle } from "./side-toggle";

interface Props {
	orderType: OrderType;
	side: Side;
	sideLabels: SideLabels;
	marketKind: MarketKind | undefined;
	onOrderTypeChange: (type: OrderType) => void;
	onSideChange: (side: Side) => void;
	marginMode?: MarginMode;
	leverage?: number;
	onMarginLeverageClick?: () => void;
	isLeveraged?: boolean;
}

export function TradeHeader({
	orderType,
	side,
	sideLabels,
	marketKind,
	onOrderTypeChange,
	onSideChange,
	marginMode,
	leverage,
	onMarginLeverageClick,
	isLeveraged,
}: Props) {
	const tabsOrderType = getTabsOrderType(orderType);

	const orderTypeLabel =
		tabsOrderType === "advanced"
			? getAdvancedOrderLabel(orderType, t`Other`)
			: tabsOrderType === "market"
				? t`Market`
				: t`Limit`;

	const isSpot = marketKind === "spot";
	const orderTypeItems = [
		{ label: t`Market`, active: orderType === "market", onSelect: () => onOrderTypeChange("market") },
		{ label: t`Limit`, active: orderType === "limit", onSelect: () => onOrderTypeChange("limit") },
		...(!isSpot
			? [
					{
						label: t`Stop Market`,
						active: orderType === "stopMarket",
						onSelect: () => onOrderTypeChange("stopMarket" as OrderType),
					},
					{
						label: t`Stop Limit`,
						active: orderType === "stopLimit",
						onSelect: () => onOrderTypeChange("stopLimit" as OrderType),
					},
				]
			: []),
		{ label: t`TWAP`, active: orderType === "twap", onSelect: () => onOrderTypeChange("twap" as OrderType) },
		{ label: t`Scale`, active: orderType === "scale", onSelect: () => onOrderTypeChange("scale" as OrderType) },
	];

	const marginLabel = marginMode === "isolated" ? t`Isolated` : t`Cross`;

	return (
		<div className="min-w-0 space-y-4">
			<div className="flex items-center justify-between">
				<Dropdown
					trigger={<span className="flex items-center gap-0.5 font-semibold text-fg">{orderTypeLabel}</span>}
					items={orderTypeItems}
					size="sm"
					align="start"
					triggerVariant="minimal"
					triggerAriaLabel={t`Order type`}
					className="inline-flex"
				/>
				{isLeveraged && (
					<button
						type="button"
						onClick={onMarginLeverageClick}
						className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors cursor-pointer"
					>
						<span>
							{marginLabel} · {leverage ?? 1}x
						</span>
						<PencilSimpleIcon className="size-3" />
					</button>
				)}
			</div>

			<SideToggle side={side} onSideChange={onSideChange} labels={sideLabels} />
		</div>
	);
}
