import { t } from "@lingui/core/macro";
import {
	AlignVerticalDistributeCenter,
	Check,
	ChevronDown,
	Crosshair,
	type LucideIcon,
	Octagon,
	OctagonX,
	Target,
	Timer,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cn";
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
}

type AdvancedOrderOption = {
	value: AdvancedOrderType;
	label: string;
	icon: LucideIcon;
	group: "trigger" | "execution";
};

const ADVANCED_ORDER_ICONS: Record<AdvancedOrderType, LucideIcon> = {
	stopMarket: Octagon,
	stopLimit: OctagonX,
	takeProfitMarket: Target,
	takeProfitLimit: Crosshair,
	twap: Timer,
	scale: AlignVerticalDistributeCenter,
};

const ADVANCED_ORDER_OPTIONS: AdvancedOrderOption[] = ADVANCED_ORDER_TYPES.map((value) => ({
	value,
	label: ADVANCED_ORDER_LABELS[value],
	icon: ADVANCED_ORDER_ICONS[value],
	group: ADVANCED_ORDER_GROUPS[value],
}));

const TRIGGER_OPTIONS = ADVANCED_ORDER_OPTIONS.filter((option) => option.group === "trigger");
const EXECUTION_OPTIONS = ADVANCED_ORDER_OPTIONS.filter((option) => option.group === "execution");

export function AdvancedOrderDropdown({ orderType, onOrderTypeChange }: Props) {
	const isAdvanced = isAdvancedOrderType(orderType);
	const label = getAdvancedOrderLabel(orderType, t`Pro`);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"text-3xs uppercase tracking-wider transition-colors",
						"text-muted-fg hover:text-fg",
						"border-b border-transparent",
						isAdvanced && "text-info border-info",
					)}
					aria-label={t`Advanced order types`}
				>
					<span className="inline-flex items-center gap-1">
						{isAdvanced ? label : t`Pro`}
						<ChevronDown className={cn("size-3", isAdvanced ? "text-info" : "text-muted-fg")} />
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-44">
				<DropdownMenuLabel className="text-3xs uppercase tracking-widest text-muted-fg/70">
					{t`Trigger`}
				</DropdownMenuLabel>
				{TRIGGER_OPTIONS.map((option) => (
					<AdvancedOrderItem
						key={option.value}
						option={option}
						isSelected={orderType === option.value}
						onSelect={() => onOrderTypeChange(option.value)}
					/>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="text-3xs uppercase tracking-widest text-muted-fg/70">
					{t`Execution`}
				</DropdownMenuLabel>
				{EXECUTION_OPTIONS.map((option) => (
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
					isSelected ? "bg-info/15 text-info" : "bg-muted/40 text-muted-fg",
				)}
			>
				<Icon className="size-3" />
			</span>
			<span className={cn("flex-1 text-xs", isSelected ? "text-fg font-medium" : "text-muted-fg")}>
				{option.label}
			</span>
			{isSelected && <Check className="size-3.5 text-info" />}
		</DropdownMenuItem>
	);
}
