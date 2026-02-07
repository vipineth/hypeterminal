import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/cn";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />;
}

const tabsListVariants = cva("inline-flex items-center", {
	variants: {
		variant: {
			pill: "gap-1 rounded-xs bg-surface-100 text-3xs p-0.5",
			underline: "gap-1 text-xs border-b border-border",
		},
	},
	defaultVariants: {
		variant: "pill",
	},
});

type TabsListVariant = NonNullable<VariantProps<typeof tabsListVariants>["variant"]>;

interface TabsListProps
	extends React.ComponentProps<typeof TabsPrimitive.List>,
		VariantProps<typeof tabsListVariants> {}

function TabsList({ className, variant = "pill", ...props }: TabsListProps) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"relative inline-flex items-center justify-center whitespace-nowrap select-none gap-1.5 px-2 py-1.5 uppercase tracking-wider transition-colors",
				"text-fg-800 cursor-pointer hover:text-fg-950",
				"data-[state=active]:font-semibold data-[state=active]:text-fg-950",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				"disabled:pointer-events-none disabled:text-fg-300",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
				"[[data-variant=pill]_&]:rounded-xs [[data-variant=pill]_&]:data-[state=active]:bg-surface-800 [[data-variant=pill]_&_svg:not([class*='size-'])]:size-2.5",
				"[[data-variant=underline]_&]:-mb-px [[data-variant=underline]_&]:border-b-2 [[data-variant=underline]_&]:border-transparent [[data-variant=underline]_&]:pb-2 [[data-variant=underline]_&]:data-[state=active]:border-action-primary",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
export type { TabsListVariant };
