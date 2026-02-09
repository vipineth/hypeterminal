import { TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
		<Tabs value={side} onValueChange={(v) => onSideChange(v as Side)} className="mb-2">
			<TabsList variant="pill" className="w-full">
				<TabsTrigger
					value="buy"
					className="flex-1 text-sm data-[state=active]:text-market-up-600"
					aria-label={labels.buyAria}
				>
					<TrendUpIcon className="size-4" />
					{labels.buy}
				</TabsTrigger>
				<TabsTrigger
					value="sell"
					className="flex-1 text-sm data-[state=active]:text-market-down-600"
					aria-label={labels.sellAria}
				>
					<TrendDownIcon className="size-4" />
					{labels.sell}
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
