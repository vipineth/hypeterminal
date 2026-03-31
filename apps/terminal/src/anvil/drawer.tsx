import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

type DrawerSide = "right" | "left" | "top" | "bottom";

const DrawerSideContext = React.createContext<DrawerSide>("right");

const sideToSwipeDirection: Record<DrawerSide, "up" | "down" | "left" | "right"> = {
	right: "right",
	left: "left",
	top: "up",
	bottom: "down",
};

interface DrawerProps extends React.ComponentPropsWithoutRef<typeof BaseDrawer.Root> {
	side?: DrawerSide;
}

function Drawer({ side = "right", swipeDirection, children, ...props }: DrawerProps) {
	return (
		<DrawerSideContext.Provider value={side}>
			<BaseDrawer.Root swipeDirection={swipeDirection ?? sideToSwipeDirection[side]} {...props}>
				{children}
			</BaseDrawer.Root>
		</DrawerSideContext.Provider>
	);
}
Drawer.displayName = "Drawer";

type DrawerTriggerProps = React.ComponentPropsWithoutRef<typeof BaseDrawer.Trigger>;

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(({ className, ...props }, ref) => (
	<BaseDrawer.Trigger ref={ref} className={className} {...props} />
));
DrawerTrigger.displayName = "DrawerTrigger";

type DrawerCloseProps = React.ComponentPropsWithoutRef<typeof BaseDrawer.Close>;

const DrawerClose = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(({ className, ...props }, ref) => (
	<BaseDrawer.Close ref={ref} className={className} {...props} />
));
DrawerClose.displayName = "DrawerClose";

type DrawerOverlayProps = React.ComponentPropsWithoutRef<typeof BaseDrawer.Backdrop>;

const DrawerOverlay = React.forwardRef<HTMLDivElement, DrawerOverlayProps>(({ className, ...props }, ref) => (
	<BaseDrawer.Backdrop
		ref={ref}
		className={cn(
			"fixed inset-0 z-50 bg-fill-overlay backdrop-blur transition-opacity duration-300 motion-reduce:transition-none",
			"data-starting-style:opacity-0 data-ending-style:opacity-0",
			className,
		)}
		{...props}
	/>
));
DrawerOverlay.displayName = "DrawerOverlay";

const drawerContentVariants = cva(
	[
		"fixed z-50 flex flex-col bg-bg-overlay border border-stroke-weak shadow-overlay",
		"transition-transform duration-300 ease-out motion-reduce:transition-none",
	],
	{
		variants: {
			side: {
				right: [
					"inset-y-0 right-0 max-w-full",
					"data-starting-style:translate-x-full data-ending-style:translate-x-full",
				],
				left: [
					"inset-y-0 left-0 max-w-full",
					"data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
				],
				top: ["inset-x-0 top-0", "data-starting-style:-translate-y-full data-ending-style:-translate-y-full"],
				bottom: ["inset-x-0 bottom-0", "data-starting-style:translate-y-full data-ending-style:translate-y-full"],
			},
			size: {
				default: "",
				wide: "",
			},
		},
		compoundVariants: [
			{ side: "right", size: "default", className: "w-100" },
			{ side: "right", size: "wide", className: "w-150" },
			{ side: "left", size: "default", className: "w-100" },
			{ side: "left", size: "wide", className: "w-150" },
		],
		defaultVariants: {
			side: "right",
			size: "default",
		},
	},
);

interface DrawerContentProps
	extends React.ComponentPropsWithoutRef<typeof BaseDrawer.Popup>,
		Omit<VariantProps<typeof drawerContentVariants>, "side"> {
	overlay?: boolean;
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
	({ className, overlay = true, size, children, ...props }, ref) => {
		const side = React.useContext(DrawerSideContext);
		return (
			<BaseDrawer.Portal>
				{overlay && <DrawerOverlay />}
				<BaseDrawer.Popup ref={ref} className={cn(drawerContentVariants({ side, size }), className)} {...props}>
					{children}
				</BaseDrawer.Popup>
			</BaseDrawer.Portal>
		);
	},
);
DrawerContent.displayName = "DrawerContent";

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center gap-4 px-8 py-6 border-b border-stroke-weak", className)}
		{...props}
	/>
));
DrawerHeader.displayName = "DrawerHeader";

type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof BaseDrawer.Title>;

const DrawerTitle = React.forwardRef<HTMLHeadingElement, DrawerTitleProps>(({ className, ...props }, ref) => (
	<BaseDrawer.Title
		ref={ref}
		className={cn("flex-1 text-lg font-semibold text-text-strong text-balance", className)}
		{...props}
	/>
));
DrawerTitle.displayName = "DrawerTitle";

type DrawerDescriptionProps = React.ComponentPropsWithoutRef<typeof BaseDrawer.Description>;

const DrawerDescription = React.forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
	({ className, ...props }, ref) => (
		<BaseDrawer.Description ref={ref} className={cn("text-sm text-text-weak text-pretty", className)} {...props} />
	),
);
DrawerDescription.displayName = "DrawerDescription";

interface DrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerBody = React.forwardRef<HTMLDivElement, DrawerBodyProps>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("flex-1 flex flex-col overflow-y-auto px-8 py-12", className)} {...props} />
));
DrawerBody.displayName = "DrawerBody";

interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center gap-4 px-8 py-6 border-t border-stroke-weak", className)}
		{...props}
	/>
));
DrawerFooter.displayName = "DrawerFooter";

export {
	Drawer,
	DrawerTrigger,
	DrawerClose,
	DrawerOverlay,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
	DrawerBody,
	DrawerFooter,
	drawerContentVariants,
};
export type {
	DrawerProps,
	DrawerTriggerProps,
	DrawerCloseProps,
	DrawerOverlayProps,
	DrawerContentProps,
	DrawerHeaderProps,
	DrawerTitleProps,
	DrawerDescriptionProps,
	DrawerBodyProps,
	DrawerFooterProps,
	DrawerSide,
};
