import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { type CSSProperties, type RefObject, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col", className)} {...props} />;
}

type TabsListVariant = "pill" | "underline";

interface TabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {
	variant?: TabsListVariant;
}

function useTabIndicator(listRef: RefObject<HTMLDivElement | null>, variant: TabsListVariant) {
	const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });
	const hasMounted = useRef(false);

	useEffect(() => {
		const list = listRef.current;
		if (!list) return;

		function measure() {
			const list = listRef.current;
			if (!list) return;
			const active = list.querySelector<HTMLElement>('[data-state="active"]');
			if (!active) {
				setStyle((s) => ({ ...s, opacity: 0 }));
				return;
			}

			const next: CSSProperties = {
				width: active.offsetWidth,
				transform: `translateX(${active.offsetLeft}px)`,
				opacity: 1,
			};

			if (!hasMounted.current) {
				next.transition = "none";
				hasMounted.current = true;
			}

			setStyle(next);
		}

		measure();

		const mo = new MutationObserver(measure);
		mo.observe(list, { attributes: true, attributeFilter: ["data-state"], subtree: true });

		const ro = new ResizeObserver(measure);
		ro.observe(list);

		return () => {
			mo.disconnect();
			ro.disconnect();
		};
	}, [listRef, variant]);

	return style;
}

function TabsList({ className, variant = "pill", ...props }: TabsListProps) {
	const listRef = useRef<HTMLDivElement>(null);
	const indicatorStyle = useTabIndicator(listRef, variant);

	return (
		<TabsPrimitive.List
			ref={listRef}
			data-slot="tabs-list"
			className={cn("relative inline-flex items-center gap-1", className)}
			{...props}
		>
			<span
				aria-hidden
				className={cn(
					"absolute transition-[transform,width] duration-200 ease-out",
					variant === "pill" && "inset-y-0 rounded bg-bg shadow-sm",
					variant === "underline" && "bottom-0 h-0.5 bg-fg rounded-full",
				)}
				style={indicatorStyle}
			/>
			{props.children}
		</TabsPrimitive.List>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"relative z-10 px-2 py-0.5 text-3xs uppercase tracking-wider transition-colors",
				"text-muted-fg hover:text-fg",
				"data-[state=active]:text-fg",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-info/50",
				"disabled:pointer-events-none disabled:opacity-50",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
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
