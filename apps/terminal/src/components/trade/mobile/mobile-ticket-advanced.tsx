import { SegmentedControlItem, SegmentedControls, Toggle } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import type { AdvancedOrderType, OrderType } from "@/config/trade";
import { getAdvancedOrderTypeLabel, isAdvancedOrderType, isTriggerOrderType } from "@/lib/trade/order-types";
import { useOrderEntryActions, useReduceOnly } from "@/stores/use-order-entry-store";
import { TradeFormTif } from "../tradebox/trade-form-tif";

const PERP_ADVANCED_TYPES: AdvancedOrderType[] = ["stopMarket", "stopLimit", "twap", "scale"];
const SPOT_ADVANCED_TYPES: AdvancedOrderType[] = ["twap", "scale"];

interface Props {
	orderType: OrderType;
	isSpot: boolean;
	hasReduceOnly: boolean;
	disabled: boolean;
}

export function MobileTicketAdvanced({ orderType, isSpot, hasReduceOnly, disabled }: Props) {
	const reduceOnly = useReduceOnly();
	const { setOrderType, setReduceOnly } = useOrderEntryActions();
	const triggerOrder = isTriggerOrderType(orderType);
	const showTif = orderType === "limit" || orderType === "scale";
	const types = isSpot ? SPOT_ADVANCED_TYPES : PERP_ADVANCED_TYPES;

	return (
		<div className="flex flex-col gap-3 border-t border-stroke-weak/40 px-3 py-3">
			<SegmentedControls
				size="xs"
				fullWidth
				value={isAdvancedOrderType(orderType) ? orderType : ""}
				onValueChange={(value) => setOrderType(value as OrderType)}
			>
				{types.map((type) => (
					<SegmentedControlItem key={type} value={type}>
						{getAdvancedOrderTypeLabel(type)}
					</SegmentedControlItem>
				))}
			</SegmentedControls>
			{(hasReduceOnly || showTif) && (
				<div className="flex items-center gap-3">
					{hasReduceOnly && (
						<Toggle
							size="sm"
							label={t`Reduce only`}
							checked={triggerOrder || reduceOnly}
							onCheckedChange={setReduceOnly}
							disabled={disabled || triggerOrder}
						/>
					)}
					{showTif && <TradeFormTif orderType={orderType} disabled={disabled} />}
				</div>
			)}
		</div>
	);
}
