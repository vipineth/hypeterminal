import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { DEFAULT_SIZE } from "./config";
import { cn } from "./utils";

type BadgeDotTone = "error" | "warning" | "success" | "information" | "neutral" | "brand";

const badgeDotVariants = cva(["inline-block shrink-0 rounded-full"], {
	variants: {
		tone: {
			error: "bg-error",
			warning: "bg-warning",
			success: "bg-success",
			information: "bg-info",
			neutral: "bg-fill",
			brand: "bg-brand",
		},
		size: {
			xxs: "size-1",
			xs: "size-1",
			sm: "size-1.5",
			md: "size-2",
			lg: "size-3",
		},
	},
	defaultVariants: {
		tone: "neutral",
		size: "sm",
	},
});

interface BadgeDotProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeDotVariants> {
	tone?: BadgeDotTone;
	outline?: boolean;
}

const BadgeDot = React.forwardRef<HTMLSpanElement, BadgeDotProps>(
	({ className, tone = "neutral", size: sizeProp, outline, ...props }, ref) => {
		const size = sizeProp ?? DEFAULT_SIZE;

		return (
			<span
				className={cn(badgeDotVariants({ tone, size }), outline && "ring-2 ring-background", className)}
				ref={ref}
				{...props}
			/>
		);
	},
);
BadgeDot.displayName = "BadgeDot";

export type { BadgeDotProps, BadgeDotTone };
export { BadgeDot, badgeDotVariants };
