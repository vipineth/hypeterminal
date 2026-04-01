import { Menu } from "@base-ui/react/menu";
import { CaretDown } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const dropdownTriggerVariants = cva(
	[
		"inline-flex items-center justify-center gap-2 cursor-pointer select-none",
		"rounded-8 border border-stroke-strong bg-bg-base",
		"font-semibold transition-colors",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-popup-open:border-stroke-focus",
		"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 text-2xs gap-1",
				xs: "py-1 px-2 text-xs gap-1",
				sm: "py-1.5 px-3 text-xs gap-1.5",
				md: "py-2 px-4 text-sm gap-2",
				lg: "py-3 px-6 text-sm gap-2",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

const dropdownItemVariants = cva(
	[
		"flex items-center gap-2 rounded-8 cursor-pointer select-none",
		"transition-colors",
		"data-highlighted:bg-fill-hover",
		"data-disabled:text-text-disabled data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "px-2 py-1 text-2xs",
				xs: "px-2 py-1 text-xs",
				sm: "px-3 py-1.5 text-xs",
				md: "px-3 py-2 text-xs",
				lg: "px-3 py-2 text-sm",
			},
			intent: {
				neutral: "text-text-strong",
				danger: "text-text-error",
			},
		},
		defaultVariants: {
			size: "sm",
			intent: "neutral",
		},
	},
);

interface DropdownItem {
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
	danger?: boolean;
	onSelect?: () => void;
}

interface DropdownGroup {
	label?: string;
	items: DropdownItem[];
}

interface DropdownProps extends VariantProps<typeof dropdownTriggerVariants> {
	trigger?: React.ReactNode;
	items?: DropdownItem[];
	groups?: DropdownGroup[];
	disabled?: boolean;
	className?: string;
	align?: "start" | "center" | "end";
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
	({ className, size: sizeProp, trigger, items, groups, disabled = false, align = "start" }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const itemSize = size;

		const renderItem = (item: DropdownItem, index: number) => (
			<Menu.Item
				key={index}
				disabled={item.disabled}
				onClick={item.onSelect}
				className={cn(
					dropdownItemVariants({
						size: itemSize,
						intent: item.danger ? "danger" : "neutral",
					}),
				)}
			>
				{item.icon && (
					<span
						className={cn(
							"shrink-0",
							item.danger ? "text-icon-error" : "text-icon-neutral",
							item.disabled && "text-icon-disabled",
						)}
					>
						{item.icon}
					</span>
				)}
				{item.label}
			</Menu.Item>
		);

		return (
			<div className={className} ref={ref}>
				<Menu.Root disabled={disabled}>
					<Menu.Trigger className={cn(dropdownTriggerVariants({ size }), "text-text-strong")}>
						{trigger ?? "Menu"}
						<CaretDown
							size={itemSize === "sm" ? 14 : 16}
							weight="bold"
							className="shrink-0 text-icon-neutral transition-transform [[data-popup-open]>&]:rotate-180"
						/>
					</Menu.Trigger>

					<Menu.Portal>
						<Menu.Positioner sideOffset={4} align={align}>
							<Menu.Popup className="z-50 bg-bg-overlay shadow-overlay rounded-12 border border-stroke-weak p-1 min-w-40 transition-[opacity,transform] duration-150 ease-out origin-(--transform-origin) data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95">
								{items?.map((item, i) => renderItem(item, i))}

								{groups?.map((group, groupIndex) => (
									<React.Fragment key={groupIndex}>
										{groupIndex > 0 && <Menu.Separator className="my-1 h-px bg-stroke-weak" />}
										<Menu.Group>
											{group.label && (
												<Menu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-text-weak select-none">
													{group.label}
												</Menu.GroupLabel>
											)}
											{group.items.map((item, i) => renderItem(item, i))}
										</Menu.Group>
									</React.Fragment>
								))}
							</Menu.Popup>
						</Menu.Positioner>
					</Menu.Portal>
				</Menu.Root>
			</div>
		);
	},
);
Dropdown.displayName = "Dropdown";

export { Dropdown, dropdownTriggerVariants, dropdownItemVariants };
export type { DropdownProps, DropdownItem, DropdownGroup };
