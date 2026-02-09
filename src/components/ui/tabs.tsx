import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { createContext, useContext, useId, useState } from "react";
import { cn } from "@/lib/cn";

const TabsValueContext = createContext<string | undefined>(undefined);
const TabsListContext = createContext({ variant: "pill" as TabsListVariant, layoutId: "tab" });

function Tabs({
	className,
	value,
	defaultValue,
	onValueChange,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	const [internalValue, setInternalValue] = useState(defaultValue);
	const isControlled = value !== undefined;
	const activeValue = isControlled ? value : internalValue;

	function handleValueChange(newValue: string) {
		if (!isControlled) setInternalValue(newValue);
		onValueChange?.(newValue);
	}

	return (
		<TabsValueContext.Provider value={activeValue}>
			<TabsPrimitive.Root
				data-slot="tabs"
				className={cn("flex flex-col", className)}
				value={activeValue}
				onValueChange={handleValueChange}
				{...props}
			/>
		</TabsValueContext.Provider>
	);
}

const tabsListVariants = cva("inline-flex items-center", {
	variants: {
		variant: {
			pill: "gap-1 rounded-xs bg-surface-base text-3xs p-0.5",
			underline: "gap-1 text-xs shadow-[inset_0_-1px_0_0_var(--color-border-200)]",
		},
	},
	defaultVariants: {
		variant: "pill",
	},
});

type TabsListVariant = NonNullable<VariantProps<typeof tabsListVariants>["variant"]>;

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List>, VariantProps<typeof tabsListVariants> {
	fullWidth?: boolean;
}

function TabsList({ className, variant = "pill", fullWidth, children, ...props }: TabsListProps) {
	const layoutId = useId();

	return (
		<TabsListContext.Provider value={{ variant: variant ?? "pill", layoutId }}>
			<TabsPrimitive.List
				data-slot="tabs-list"
				data-variant={variant}
				className={cn(tabsListVariants({ variant }), fullWidth ? "w-full" : "w-fit", className)}
				{...props}
			>
				{children}
			</TabsPrimitive.List>
		</TabsListContext.Provider>
	);
}

function TabsTrigger({ className, value, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	const activeValue = useContext(TabsValueContext);
	const { variant, layoutId } = useContext(TabsListContext);
	const isActive = value !== undefined && activeValue === value;
	const prefersReducedMotion = useReducedMotion();

	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			value={value}
			className={cn(
				"relative inline-flex items-center justify-center whitespace-nowrap select-none gap-1.5 px-2 py-1.5 uppercase tracking-wider transition-colors",
				"text-text-950 cursor-pointer hover:text-text-950",
				"data-[state=active]:font-semibold data-[state=active]:text-text-950",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-default/50",
				"disabled:pointer-events-none disabled:text-text-400",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
				"in-data-[variant=pill]:rounded-xs [[data-variant=pill]_&_svg:not([class*='size-'])]:size-2.5",
				"in-data-[variant=underline]:pb-2",
				className,
			)}
			{...props}
		>
			<span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>
			{isActive && (
				<motion.span
					layoutId={prefersReducedMotion ? undefined : layoutId}
					className={cn(
						"absolute",
						variant === "pill" && "inset-0 rounded-xs bg-surface-execution",
						variant === "underline" && "bottom-0 inset-x-0 h-0.5 bg-primary-default",
					)}
					transition={
						variant === "underline"
							? { type: "spring", bounce: 0, duration: 0.2 }
							: { type: "spring", bounce: 0.15, duration: 0.25 }
					}
				/>
			)}
		</TabsPrimitive.Trigger>
	);
}

function TabsContent({ className, forceMount, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			forceMount={forceMount}
			className={cn(
				"flex-1 outline-none",
				forceMount && "[&[hidden]]:block data-[state=inactive]:invisible",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContentGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="tabs-content-group"
			className={cn("grid [&>*]:col-start-1 [&>*]:row-start-1", className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsContentGroup, tabsListVariants };
export type { TabsListVariant };
