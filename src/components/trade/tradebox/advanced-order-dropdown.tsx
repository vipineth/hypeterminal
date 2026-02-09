import { t } from "@lingui/core/macro";
import {
	CaretDownIcon,
	CheckIcon,
	CrosshairIcon,
	type Icon,
	OctagonIcon,
	RowsIcon,
	TargetIcon,
	TimerIcon,
	XCircleIcon,
} from "@phosphor-icons/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function AdvancedOrderDropdown({ orderType, onOrderTypeChange, marketKind = "perp" }: Props) {
	const isAdvanced = isAdvancedOrderType(orderType);
	const label = getAdvancedOrderLabel(orderType, t`Other`);

	const triggerOptions = getFilteredOptions(TRIGGER_OPTIONS, marketKind);
	const executionOptions = getFilteredOptions(EXECUTION_OPTIONS, marketKind);
	const hasTriggerOptions = triggerOptions.length > 0;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="inline-flex items-center gap-1 outline-none hover:text-text-950 transition-colors"
					aria-label={t`Advanced order types`}
				>
					{isAdvanced ? label : t`Other`}
					<CaretDownIcon className="size-3 text-text-600" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44">
				{hasTriggerOptions && (
					<>
						<DropdownMenuLabel className="text-3xs uppercase tracking-widest text-text-950">
							{t`Trigger`}
						</DropdownMenuLabel>
						{triggerOptions.map((option) => (
							<AdvancedOrderItem
								key={option.value}
								option={option}
								isSelected={orderType === option.value}
								onSelect={() => onOrderTypeChange(option.value)}
							/>
						))}
						<DropdownMenuSeparator />
					</>
				)}
				<DropdownMenuLabel className="text-3xs uppercase tracking-widest text-text-950">
					{t`Execution`}
				</DropdownMenuLabel>
				{executionOptions.map((option) => (
					<AdvancedOrderItem
						key={option.value}
						option={option}
						isSelected={orderType === option.value}
						onSelect={() => onOrderTypeChange(option.value)}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface AdvancedOrderItemProps {
	option: AdvancedOrderOption;
	isSelected: boolean;
	onSelect: () => void;
}

function AdvancedOrderItem({ option, isSelected, onSelect }: AdvancedOrderItemProps) {
	const Icon = option.icon;
	return (
		<DropdownMenuItem selected={isSelected} onSelect={onSelect} className="gap-2.5 py-1.5 pl-1.5 pr-2">
			<span
				className={cn(
					"flex size-5 items-center justify-center rounded transition-colors",
					isSelected ? "bg-primary-default/15 text-primary-default" : "bg-surface-analysis text-text-600",
				)}
			>
				<Icon className="size-3" />
			</span>
			<span className={cn("flex-1 text-xs", isSelected ? "text-text-950 font-medium" : "text-text-600")}>
				{option.label}
			</span>
			{isSelected && <CheckIcon className="size-3.5 text-primary-default" />}
		</DropdownMenuItem>
	);
}
