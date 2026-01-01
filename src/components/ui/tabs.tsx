import * as TabsPrimitive from "@radix-ui/react-tabs";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-1", className)} {...props} />;
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn("inline-flex items-center gap-1", className)}
			{...props}
		/>
	);
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger> & {
	variant?: "default" | "underline";
};

function TabsTrigger({ className, variant = "default", ...props }: TabsTriggerProps) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"px-2 py-0.5 text-3xs uppercase tracking-wider transition-colors",
				"text-muted-foreground hover:text-foreground",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terminal-cyan/50",
				"disabled:pointer-events-none disabled:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
				variant === "default" && "data-[state=active]:text-terminal-cyan data-[state=active]:bg-terminal-cyan/10",
				variant === "underline" && [
					"border-b border-transparent",
					"data-[state=active]:text-terminal-cyan data-[state=active]:border-terminal-cyan",
				],
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

