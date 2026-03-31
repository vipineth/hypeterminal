import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const badgeCountVariants = cva(
	[
		"inline-flex items-center justify-center",
		"h-6 min-w-6 px-2",
		"rounded-16",
		"text-xs font-normal text-center whitespace-nowrap tabular-nums",
	],
	{
		variants: {
			emphasis: {
				strong: "bg-fill-error-strong text-text-inverse-strong",
				moderate: "bg-fill-error-weak border border-stroke-error-weak text-text-error",
				weak: "bg-fill-weak border border-stroke-weak text-text-weak",
			},
		},
		defaultVariants: {
			emphasis: "strong",
		},
	},
);

interface BadgeCountProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeCountVariants> {}

const BadgeCount = React.forwardRef<HTMLSpanElement, BadgeCountProps>(
	({ className, emphasis, children, ...props }, ref) => {
		return (
			<span className={cn(badgeCountVariants({ emphasis, className }))} ref={ref} {...props}>
				{children}
			</span>
		);
	},
);
BadgeCount.displayName = "BadgeCount";

export { BadgeCount, badgeCountVariants };
export type { BadgeCountProps };
