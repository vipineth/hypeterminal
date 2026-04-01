import { Tabs } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

type SegmentedControlSize = "xxs" | "xs" | "sm" | "md" | "lg";

const SegmentedControlsContext = React.createContext<{
	size: SegmentedControlSize;
	fullWidth: boolean;
	disabled: boolean;
}>({
	size: "sm",
	fullWidth: false,
	disabled: false,
});

const segmentedControlsVariants = cva(
	["inline-flex items-center", "bg-fill-weak border border-stroke-weak rounded-8"],
	{
		variants: {
			fullWidth: {
				true: "w-full",
			},
		},
		defaultVariants: {
			fullWidth: false,
		},
	},
);

const segmentedControlItemVariants = cva(
	[
		"relative inline-flex items-center justify-center",
		"rounded-8 font-normal text-text-weak",
		"border border-transparent",
		"cursor-pointer select-none whitespace-nowrap",
		"transition-colors duration-150 motion-reduce:transition-none",
		"data-active:text-text-strong",
		"hover:text-text-strong",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			size: {
				xxs: "py-0.5 px-1.5 text-2xs gap-0.5",
				xs: "py-1 px-2 text-xs gap-1",
				sm: "py-1.5 px-3 text-xs gap-1",
				md: "py-3 px-4 text-sm gap-1",
				lg: "py-3 px-6 text-base gap-1.5",
			},
		},
		defaultVariants: {
			size: "sm",
		},
	},
);

interface SegmentedControlsProps extends VariantProps<typeof segmentedControlsVariants> {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	size?: SegmentedControlSize;
	disabled?: boolean;
	className?: string;
	children: React.ReactNode;
}

const SegmentedControls = React.forwardRef<HTMLDivElement, SegmentedControlsProps>(
	(
		{ className, value, defaultValue, onValueChange, size: sizeProp, fullWidth, disabled = false, children, ...props },
		ref,
	) => {
		const size = (sizeProp ?? DEFAULT_SIZE) as SegmentedControlSize;

		return (
			<SegmentedControlsContext.Provider value={{ size, fullWidth: !!fullWidth, disabled }}>
				<Tabs.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
					<Tabs.List
						ref={ref}
						className={cn("relative", segmentedControlsVariants({ fullWidth, className }))}
						{...props}
					>
						<Tabs.Indicator
							className="absolute inset-y-0  rounded-8 bg-bg-overlay border border-stroke-strong shadow-raised transition-[left,width] duration-200 ease-in-out motion-reduce:transition-none"
							style={{
								left: "var(--active-tab-left)",
								width: "var(--active-tab-width)",
							}}
						/>
						{children}
					</Tabs.List>
				</Tabs.Root>
			</SegmentedControlsContext.Provider>
		);
	},
);
SegmentedControls.displayName = "SegmentedControls";

interface SegmentedControlItemProps extends React.ComponentPropsWithoutRef<typeof Tabs.Tab> {
	icon?: React.ReactNode;
}

const SegmentedControlItem = React.forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
	({ className, icon, disabled: itemDisabled, children, ...props }, ref) => {
		const { size, fullWidth, disabled: groupDisabled } = React.useContext(SegmentedControlsContext);

		return (
			<Tabs.Tab
				ref={ref}
				disabled={groupDisabled || itemDisabled}
				className={cn(segmentedControlItemVariants({ size }), fullWidth && "flex-1", className)}
				{...props}
			>
				{icon}
				{children}
			</Tabs.Tab>
		);
	},
);
SegmentedControlItem.displayName = "SegmentedControlItem";

export { SegmentedControls, SegmentedControlItem, segmentedControlsVariants, segmentedControlItemVariants };
export type { SegmentedControlsProps, SegmentedControlItemProps };
