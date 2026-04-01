import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const tooltipPopupVariants = cva([
	"bg-bg-inverse text-text-inverse-strong",
	"text-xs font-normal",
	"rounded-8 px-3 py-2",
	"shadow-overlay",
	"origin-(--transform-origin)",
	"transition-[opacity,transform] duration-150",
	"data-starting-style:opacity-0",
	"data-ending-style:opacity-0",
	"data-instant:duration-0",
	"motion-reduce:transition-none",
]);

const tooltipArrowVariants = cva(["size-2 rotate-45 bg-bg-inverse"]);

interface TooltipProps extends VariantProps<typeof tooltipPopupVariants> {
	children: React.ReactElement;
	content: React.ReactNode;
	side?: "top" | "bottom" | "left" | "right";
	align?: "start" | "center" | "end";
	sideOffset?: number;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	delay?: number;
	closeDelay?: number;
	arrow?: boolean;
	className?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
	(
		{
			children,
			content,
			side = "top",
			align = "center",
			sideOffset = 8,
			open,
			defaultOpen,
			onOpenChange,
			delay,
			closeDelay,
			arrow = true,
			className,
		},
		ref,
	) => {
		if (!content) return children;

		return (
			<BaseTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
				<BaseTooltip.Trigger delay={delay} closeDelay={closeDelay} render={children} />
				<BaseTooltip.Portal>
					<BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
						<BaseTooltip.Popup ref={ref} className={cn(tooltipPopupVariants(), className)}>
							{content}
							{arrow && (
								<BaseTooltip.Arrow>
									<div className={cn(tooltipArrowVariants())} />
								</BaseTooltip.Arrow>
							)}
						</BaseTooltip.Popup>
					</BaseTooltip.Positioner>
				</BaseTooltip.Portal>
			</BaseTooltip.Root>
		);
	},
);
Tooltip.displayName = "Tooltip";

const TooltipProvider = BaseTooltip.Provider;

export { Tooltip, TooltipProvider, tooltipPopupVariants, tooltipArrowVariants };
export type { TooltipProps };
