import { Dropdown, type DropdownGroup } from "@hypeterminal/ui";
import { t } from "@lingui/core/macro";
import {
	CrosshairIcon,
	type Icon,
	OctagonIcon,
	RowsIcon,
	TargetIcon,
	TimerIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { MarketKind } from "@/lib/hyperliquid";
import {
	ADVANCED_ORDER_GROUPS,
	ADVANCED_ORDER_LABELS,
	ADVANCED_ORDER_TYPES,
	type AdvancedOrderType,
	getAdvancedOrderLabel,
	isAdvancedOrderType,
	type OrderType,
} from "@/lib/trade/order-types";

interface Props {
	orderType: OrderType;
	onOrderTypeChange: (type: OrderType) => void;
	marketKind?: MarketKind;
	className?: string;
}

type AdvancedOrderOption = {
	value: AdvancedOrderType;
	label: string;
	icon: Icon;
	group: "trigger" | "execution";
};

const ADVANCED_ORDER_ICONS: Record<AdvancedOrderType, Icon> = {
	stopMarket: OctagonIcon,
	stopLimit: XCircleIcon,
	takeProfitMarket: TargetIcon,
	takeProfitLimit: CrosshairIcon,
	twap: TimerIcon,
	scale: RowsIcon,
};

const ADVANCED_ORDER_OPTIONS: AdvancedOrderOption[] = ADVANCED_ORDER_TYPES.map((value) => ({
	value,
	label: ADVANCED_ORDER_LABELS[value],
	icon: ADVANCED_ORDER_ICONS[value],
	group: ADVANCED_ORDER_GROUPS[value],
}));

const TRIGGER_OPTIONS = ADVANCED_ORDER_OPTIONS.filter((option) => option.group === "trigger");
const EXECUTION_OPTIONS = ADVANCED_ORDER_OPTIONS.filter((option) => option.group === "execution");

const SPOT_ALLOWED_TYPES: AdvancedOrderType[] = ["twap", "scale"];

function getFilteredOptions(options: AdvancedOrderOption[], marketKind: MarketKind): AdvancedOrderOption[] {
	if (marketKind === "spot") {
		return options.filter((option) => SPOT_ALLOWED_TYPES.includes(option.value));
	}
	return options;
}

function toDropdownItems(options: AdvancedOrderOption[], onOrderTypeChange: (type: OrderType) => void) {
	return options.map((option) => ({
		label: option.label,
		icon: <option.icon className="size-3" />,
		onSelect: () => onOrderTypeChange(option.value),
	}));
}

export function AdvancedOrderDropdown({ orderType, onOrderTypeChange, marketKind = "perp", className }: Props) {
	const isAdvanced = isAdvancedOrderType(orderType);
	const label = getAdvancedOrderLabel(orderType, t`Other`);

	const triggerOptions = getFilteredOptions(TRIGGER_OPTIONS, marketKind);
	const executionOptions = getFilteredOptions(EXECUTION_OPTIONS, marketKind);
	const hasTriggerOptions = triggerOptions.length > 0;

	const groups: DropdownGroup[] = [
		...(hasTriggerOptions ? [{ label: t`Trigger`, items: toDropdownItems(triggerOptions, onOrderTypeChange) }] : []),
		{ label: t`Execution`, items: toDropdownItems(executionOptions, onOrderTypeChange) },
	];

	return (
		<Dropdown
			trigger={
				<span
					className={cn("inline-flex items-center outline-none hover:text-text-strong transition-colors", className)}
				>
					{isAdvanced ? label : t`Other`}
				</span>
			}
			groups={groups}
			align="end"
			className="min-w-0"
		/>
	);
}
