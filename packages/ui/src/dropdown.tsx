import { Menu } from "@base-ui/react/menu";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

const dropdownTriggerVariants = cva(
	[
		"inline-flex items-center justify-center gap-2 cursor-pointer select-none",
		"rounded-8 border border-stroke-strong bg-background",
		"font-semibold transition-colors duration-150 motion-reduce:transition-none",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-popup-open:border-stroke-focus",
		"data-disabled:text-fg-disabled data-disabled:cursor-not-allowed",
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

const dropdownMinimalTriggerVariants = cva(
	[
		"group inline-flex items-center justify-center cursor-pointer select-none rounded-8",
		"border-0 bg-transparent shadow-none appearance-none font-normal",
		"transition-colors duration-150 motion-reduce:transition-none hover:text-fg data-[popup-open]:text-fg",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:text-fg-disabled data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "gap-0.5 px-1 py-0.5 text-2xs",
				xs: "gap-0.5 px-1.5 py-0.5 text-xs",
				sm: "gap-0.5 px-1.5 py-0.5 text-xs",
				md: "gap-1 px-2 py-1 text-sm",
				lg: "gap-1 px-2.5 py-1.5 text-sm",
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
		"transition-colors duration-150 motion-reduce:transition-none",
		"data-highlighted:bg-fill-hover",
		"data-disabled:text-fg-disabled data-disabled:cursor-not-allowed",
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
				neutral: "text-fg",
				danger: "text-error",
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
	active?: boolean;
	onSelect?: () => void;
}

interface DropdownGroup {
	label?: string;
	items: DropdownItem[];
}

interface DropdownBaseProps extends VariantProps<typeof dropdownTriggerVariants> {
	trigger?: React.ReactNode;
	items?: DropdownItem[];
	groups?: DropdownGroup[];
	disabled?: boolean;
	className?: string;
	align?: "start" | "center" | "end";
	triggerClassName?: string;
	popupClassName?: string;
}

type DropdownProps =
	| (DropdownBaseProps & { triggerVariant?: "default"; triggerAriaLabel?: string })
	| (DropdownBaseProps & { triggerVariant: "minimal"; triggerAriaLabel: string });

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
	(
		{
			className,
			size: sizeProp,
			trigger,
			items,
			groups,
			disabled = false,
			align = "start",
			triggerVariant = "default",
			triggerAriaLabel,
			triggerClassName,
			popupClassName,
		},
		ref,
	) => {
		const size = sizeProp ?? DEFAULT_SIZE;
		const itemSize = size;
		const isMinimalTrigger = triggerVariant === "minimal";
		const caretSize = isMinimalTrigger ? 12 : itemSize === "sm" ? 14 : 16;

		const renderItem = (item: DropdownItem) => (
			<Menu.Item
				key={item.label}
				disabled={item.disabled}
				onClick={item.onSelect}
				className={cn(
					dropdownItemVariants({
						size: itemSize,
						intent: item.danger ? "danger" : "neutral",
					}),
					"justify-between",
					item.active && !item.danger && "font-semibold text-fg",
				)}
			>
				<span className="flex items-center gap-2">
					{item.icon && (
						<span
							className={cn(
								"shrink-0",
								item.danger ? "text-icon-error" : "text-icon",
								item.disabled && "text-icon-disabled",
							)}
						>
							{item.icon}
						</span>
					)}
					{item.label}
				</span>
				{item.active && <CheckIcon size={12} weight="bold" className="ml-2 shrink-0 text-icon-brand" />}
			</Menu.Item>
		);

		return (
			<div className={className} ref={ref}>
				<Menu.Root disabled={disabled}>
					<Menu.Trigger
						aria-label={triggerAriaLabel}
						className={cn(
							isMinimalTrigger ? dropdownMinimalTriggerVariants({ size }) : dropdownTriggerVariants({ size }),
							!isMinimalTrigger && "text-fg",
							triggerClassName,
						)}
					>
						{trigger ?? "Menu"}
						<CaretDownIcon
							size={caretSize}
							weight={isMinimalTrigger ? "regular" : "bold"}
							className={cn(
								"shrink-0 transition-transform duration-150 motion-reduce:transition-none [[data-popup-open]>&]:rotate-180",
								isMinimalTrigger ? "text-fg-muted group-hover:text-fg group-data-[popup-open]:text-fg" : "text-icon",
							)}
						/>
					</Menu.Trigger>

					<Menu.Portal>
						<Menu.Positioner sideOffset={4} align={align} className="z-[var(--z-dropdown)]">
							<Menu.Popup
								className={cn(
									"max-h-64 min-w-40 overflow-y-auto bg-surface p-1 shadow-overlay rounded-12 border border-stroke-weak transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none origin-(--transform-origin) data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95",
									popupClassName,
								)}
							>
								{items?.map(renderItem)}

								{groups?.map((group) => (
									<React.Fragment key={group.label ?? group.items.map((item) => item.label).join("|")}>
										{group !== groups[0] && <Menu.Separator className="my-1 h-px bg-stroke-weak" />}
										<Menu.Group>
											{group.label && (
												<Menu.GroupLabel className="px-3 py-1.5 text-xs font-semibold text-fg-muted select-none">
													{group.label}
												</Menu.GroupLabel>
											)}
											{group.items.map(renderItem)}
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

export { Dropdown, dropdownMinimalTriggerVariants, dropdownTriggerVariants, dropdownItemVariants };
export type { DropdownProps, DropdownItem, DropdownGroup };
