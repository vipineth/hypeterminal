import { SegmentedControlItem, SegmentedControls } from "@hypeterminal/ui";
import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import type { Side } from "@/lib/trade/types";

interface SideLabels {
	buy: string;
	sell: string;
	buyAria: string;
	sellAria: string;
}

interface Props {
	side: Side;
	onSideChange: (side: Side) => void;
	labels: SideLabels;
}

export function SideToggle({ side, onSideChange, labels }: Props) {
	return (
		<SegmentedControls value={side} onValueChange={(v) => onSideChange(v as Side)} fullWidth className="mb-2">
			<SegmentedControlItem
				value="buy"
				className="flex-1 text-sm data-[active]:text-text-success"
				aria-label={labels.buyAria}
				icon={<TrendUpIcon className="size-4" />}
			>
				{labels.buy}
			</SegmentedControlItem>
			<SegmentedControlItem
				value="sell"
				className="flex-1 text-sm data-[active]:text-text-error"
				aria-label={labels.sellAria}
				icon={<TrendDownIcon className="size-4" />}
			>
				{labels.sell}
			</SegmentedControlItem>
		</SegmentedControls>
	);
}
