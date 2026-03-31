import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "./utils";

const dividerVariants = cva(["shrink-0 border-stroke-weak"], {
	variants: {
		orientation: {
			horizontal: "w-full border-t",
			vertical: "self-stretch border-l",
		},
	},
	defaultVariants: {
		orientation: "horizontal",
	},
});

interface DividerProps
	extends Omit<React.ComponentPropsWithoutRef<typeof BaseSeparator>, "orientation">,
		VariantProps<typeof dividerVariants> {}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
	({ className, orientation = "horizontal", ...props }, ref) => (
		<BaseSeparator
			orientation={orientation!}
			className={cn(dividerVariants({ orientation, className }))}
			ref={ref}
			{...props}
		/>
	),
);
Divider.displayName = "Divider";

export { Divider, dividerVariants };
export type { DividerProps };
