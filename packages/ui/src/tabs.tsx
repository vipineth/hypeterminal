import { Tabs } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

type TabsSize = "xxs" | "xs" | "sm" | "md" | "lg";
type TabsVariant = "underline" | "pills";

const TabsContext = React.createContext<{
	size: TabsSize;
	variant: TabsVariant;
	fullWidth: boolean;
	disabled: boolean;
}>({
	size: "sm",
	variant: "underline",
	fullWidth: false,
	disabled: false,
});

interface TabsRootProps extends React.ComponentPropsWithoutRef<typeof Tabs.Root> {
	size?: TabsSize;
	variant?: TabsVariant;
	fullWidth?: boolean;
	disabled?: boolean;
}

const TabsRoot = React.forwardRef<HTMLDivElement, TabsRootProps>(
	(
		{ size: sizeProp, variant = "underline", fullWidth = false, disabled = false, children, className, ...props },
		ref,
	) => {
		const size = (sizeProp ?? DEFAULT_SIZE) as TabsSize;

		return (
			<TabsContext.Provider value={{ size, variant, fullWidth, disabled }}>
				<Tabs.Root ref={ref} className={className} {...props}>
					{children}
				</Tabs.Root>
			</TabsContext.Provider>
		);
	},
);
TabsRoot.displayName = "Tabs";

const tabsListVariants = cva("relative flex items-center", {
	variants: {
		variant: {
			underline: "border-b border-stroke-weak",
			pills: "inline-flex bg-fill-weak border border-stroke-weak rounded-8",
		},
	},
	defaultVariants: {
		variant: "underline",
	},
});

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof Tabs.List> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(({ className, children, ...props }, ref) => {
	const { variant, fullWidth } = React.useContext(TabsContext);

	return (
		<Tabs.List ref={ref} className={cn(tabsListVariants({ variant }), fullWidth && "w-full", className)} {...props}>
			{variant === "underline" ? (
				<Tabs.Indicator
					className="absolute bottom-0 h-0.5 bg-fill-brand-strong transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
					style={{
						left: "var(--active-tab-left)",
						width: "var(--active-tab-width)",
					}}
				/>
			) : (
				<Tabs.Indicator
					className="absolute inset-y-0 rounded-8 bg-bg-overlay border border-stroke-strong shadow-raised transition-[left,width] duration-200 ease-in-out motion-reduce:transition-none"
					style={{
						left: "var(--active-tab-left)",
						width: "var(--active-tab-width)",
					}}
				/>
			)}
			{children}
		</Tabs.List>
	);
});
TabsList.displayName = "TabsList";

const tabsTriggerVariants = cva(
	[
		"inline-flex items-center justify-center",
		"font-normal text-text-weak",
		"cursor-pointer select-none whitespace-nowrap",
		"transition-colors duration-150",
		"data-active:text-text-strong",
		"hover:text-text-strong",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus",
		"data-disabled:opacity-40 data-disabled:cursor-not-allowed",
	],
	{
		variants: {
			variant: {
				underline: "bg-transparent",
				pills: "relative rounded-8 border border-transparent",
			},
			size: {
				xxs: "",
				xs: "",
				sm: "",
				md: "",
				lg: "",
			},
		},
		compoundVariants: [
			{
				variant: "underline",
				size: "xxs",
				className: "py-1 px-1.5 text-2xs gap-1",
			},
			{
				variant: "underline",
				size: "xs",
				className: "py-1.5 px-2 text-xs gap-1",
			},
			{
				variant: "underline",
				size: "sm",
				className: "py-2 px-3 text-xs gap-1.5",
			},
			{
				variant: "underline",
				size: "md",
				className: "p-3 text-sm gap-2",
			},
			{
				variant: "underline",
				size: "lg",
				className: "py-3 px-4 text-base gap-2",
			},
			{
				variant: "pills",
				size: "xxs",
				className: "py-0.5 px-1.5 text-2xs gap-0.5",
			},
			{
				variant: "pills",
				size: "xs",
				className: "py-1 px-2 text-xs gap-1",
			},
			{
				variant: "pills",
				size: "sm",
				className: "py-1.5 px-3 text-xs gap-1",
			},
			{
				variant: "pills",
				size: "md",
				className: "py-3 px-4 text-sm gap-1",
			},
			{
				variant: "pills",
				size: "lg",
				className: "py-3 px-6 text-base gap-1.5",
			},
		],
		defaultVariants: {
			variant: "underline",
			size: "sm",
		},
	},
);

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof Tabs.Tab> {
	icon?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
	({ className, icon, disabled: itemDisabled, children, ...props }, ref) => {
		const { size, variant, fullWidth, disabled: groupDisabled } = React.useContext(TabsContext);

		return (
			<Tabs.Tab
				ref={ref}
				disabled={groupDisabled || itemDisabled}
				className={cn(tabsTriggerVariants({ variant, size }), fullWidth && "flex-1", className)}
				{...props}
			>
				{icon}
				{children}
			</Tabs.Tab>
		);
	},
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof Tabs.Panel> {}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(({ className, ...props }, ref) => (
	<Tabs.Panel ref={ref} className={cn("pt-4", className)} {...props} />
));
TabsContent.displayName = "TabsContent";

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants };
export type { TabsRootProps as TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps, TabsVariant };
